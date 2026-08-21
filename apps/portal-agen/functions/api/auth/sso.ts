import { sign } from "@tsndr/cloudflare-worker-jwt";

const TENANT_ROLES = new Set(["sekolah", "guru", "siswa"]);

export const onRequestPost = async (context: any) => {
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    const { code, redirectUri } = await context.request.json();

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "Missing code or redirectUri" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const { CLIENT_ID, CLIENT_SECRET } = context.env;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error: "SSO configuration is missing on the server.",
        }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const DIASMU_TOKEN_ENDPOINT =
      "https://diasmu.labmu.workers.dev/oauth/token";
    const DIASMU_USERINFO_ENDPOINT =
      "https://diasmu.labmu.workers.dev/oauth/userinfo";

    // 1. Exchange token
    const tokenResponse = await fetch(DIASMU_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Gagal mendapatkan token dari DiasMu: ${tokenResponse.statusText}`,
        }),
        { status: tokenResponse.status, headers: jsonHeaders },
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Respon token tidak valid." }),
        { status: 500, headers: jsonHeaders },
      );
    }

    // 2. Get user info
    const userResponse = await fetch(DIASMU_USERINFO_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Gagal mendapatkan profil pengguna: ${userResponse.statusText}`,
        }),
        { status: userResponse.status, headers: jsonHeaders },
      );
    }

    const userData = await userResponse.json();

    // Check if user exists in D1 database
    const db = context.env.DB;
    const username =
      userData.email ||
      userData.name?.toLowerCase().replace(/\s+/g, ".") ||
      "user.sso";

    // Check existing by sso_id OR email OR username
    const ssoId = userData.id || userData.sub || "";
    const email = userData.email || "";
    const identityConditions: string[] = [];
    const identityValues: string[] = [];
    if (ssoId) {
      identityConditions.push("sso_id = ?");
      identityValues.push(ssoId);
    }
    if (email) {
      identityConditions.push("lower(email) = lower(?)");
      identityValues.push(email);
    }
    identityConditions.push("lower(username) = lower(?)");
    identityValues.push(username);

    const identityWhere = identityConditions.join(" OR ");
    const matched = await db
      .prepare(
        `SELECT id, username, email, sso_id, role_slug, requested_role, nama,
                initial, sekolah_id, status, wilayah, surat_tugas, masa_aktif,
                updated_at
           FROM users
          WHERE ${identityWhere}`,
      )
      .bind(...identityValues)
      .all<any>();
    const candidates = matched.results || [];
    const scoreCandidate = (candidate: any) =>
      (candidate.sekolah_id ? 8 : 0) +
      (candidate.surat_tugas ? 8 : 0) +
      (candidate.requested_role ? 4 : 0) +
      (candidate.status === "Menunggu Approve" ? 2 : 0) +
      (ssoId && candidate.sso_id === ssoId ? 1 : 0);
    candidates.sort((a: any, b: any) => scoreCandidate(b) - scoreCandidate(a));
    const existingUser = candidates[0] || null;
    const approvedCandidate = candidates.find(
      (candidate: any) =>
        candidate.status === "Aktif" &&
        candidate.role_slug &&
        candidate.role_slug !== "pending",
    );

    let finalRole = approvedCandidate?.role_slug || existingUser?.role_slug || "pending";
    const finalStatus = approvedCandidate ? "Aktif" : existingUser?.status || "Aktif";
    let finalNama =
      userData.name || (existingUser ? existingUser.nama : username);

    if (existingUser && !approvedCandidate && (existingUser.status === "Nonaktif" || existingUser.status === "Ditolak")) {
      return new Response(
        JSON.stringify({ error: "Akun Anda telah dinonaktifkan atau ditolak." }),
        { status: 403, headers: jsonHeaders },
      );
    }

    let validatedSchoolId: number | null = null;
    if (existingUser?.sekolah_id != null) {
      const schoolId = Number(existingUser.sekolah_id);
      if (Number.isInteger(schoolId) && schoolId > 0) {
        const school = await db
          .prepare("SELECT id FROM master_data_sekolah WHERE id = ? LIMIT 1")
          .bind(schoolId)
          .first<{ id: number }>();
        if (Number(school?.id) === schoolId) validatedSchoolId = schoolId;
      }
    }
    if (TENANT_ROLES.has(finalRole) && !validatedSchoolId) {
      return new Response(
        JSON.stringify({ error: "Akun belum terhubung dengan sekolah yang valid." }),
        { status: 403, headers: jsonHeaders },
      );
    }

    // Create initial
    let finalInitial = existingUser?.initial;
    if (!finalInitial) {
      finalInitial = finalNama
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join("");
    }

    const newUserId = `USR-${crypto.randomUUID()}`;

    if (existingUser) {
      // Update existing user
      await db
        .prepare(
          `
        UPDATE users SET 
          terakhir_login = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP, 
          sso_id = ?, 
          email = ?,
          nama = ?,
          role_slug = ?,
          status = ?
        WHERE id = ?
      `,
        )
        .bind(ssoId, email, finalNama, finalRole, finalStatus, existingUser.id)
        .run();

      // Samakan record kembar historis agar sekolah dan dokumen onboarding
      // terlihat konsisten pada daftar admin tanpa menghapus record apa pun.
      if (candidates.length > 1) {
        await db
          .prepare(
            `UPDATE users SET
               role_slug = ?,
               status = ?,
               sekolah_id = COALESCE(?, sekolah_id),
               wilayah = CASE WHEN ? <> '' THEN ? ELSE wilayah END,
               surat_tugas = COALESCE(?, surat_tugas),
               masa_aktif = COALESCE(?, masa_aktif),
               updated_at = CURRENT_TIMESTAMP
             WHERE ${identityWhere}`,
          )
          .bind(
            finalRole,
            finalStatus,
            existingUser.sekolah_id || null,
            existingUser.wilayah && existingUser.wilayah !== "SSO Login"
              ? existingUser.wilayah
              : "",
            existingUser.wilayah && existingUser.wilayah !== "SSO Login"
              ? existingUser.wilayah
              : "",
            existingUser.surat_tugas || null,
            existingUser.masa_aktif || null,
            ...identityValues,
          )
          .run();
      }
    } else {
      // Insert new user
      await db
        .prepare(
          `
        INSERT INTO users (id, username, nama, role_slug, wilayah, status, initial, color, terakhir_login, new_user_source, updated_at, sso_id, email)
        VALUES (
          ?1, ?2, ?3, ?4, 'SSO Login', 'Aktif', ?5, '#94a3b8', CURRENT_TIMESTAMP, 'sso', CURRENT_TIMESTAMP, ?6, ?7
        )
      `,
        )
        .bind(
          newUserId,
          username,
          finalNama,
          finalRole,
          finalInitial,
          ssoId,
          email,
        )
        .run();
        
      if (validatedSchoolId) {
        const notifId = crypto.randomUUID();
        const message = `Pendaftaran SSO baru: ${finalNama} (${finalRole})`;
        await db.prepare(
          `INSERT INTO notifications (id, sekolah_id, message) VALUES (?, ?, ?)`
        )
          .bind(notifId, validatedSchoolId, message)
          .run();
      }
    }

    // Attach role and internal id to userData before sending to client
    userData.role = finalRole;
    userData.kontenmu_username = username;
    userData.internal_id = existingUser
      ? existingUser.id
      : newUserId;
    userData.sekolahId = validatedSchoolId;

    if (!context.env.JWT_SECRET) {
      return new Response(JSON.stringify({ error: "Konfigurasi autentikasi server belum tersedia." }), {
        status: 503,
        headers: jsonHeaders,
      });
    }
    const now = Math.floor(Date.now() / 1000);
    const appToken = await sign({
      sub: userData.internal_id,
      username,
      role: finalRole,
      sekolahId: validatedSchoolId,
      iat: now,
      exp: now + 24 * 60 * 60,
    }, context.env.JWT_SECRET);

    return new Response(JSON.stringify({ userData, token: appToken }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
