import { sign } from "@tsndr/cloudflare-worker-jwt";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const onRequestPost = async (context: any) => {
  try {
    const auth = context.data?.auth || {};
    const userId = String(auth.sub || "");
    if (!userId || !context.env.JWT_SECRET) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const user = await context.env.DB.prepare(
      `SELECT id, username, nama, role_slug, wilayah, status, initial,
              sekolah_id, picture, sso_id, kelas
         FROM users
        WHERE id = ?
        LIMIT 1`,
    ).bind(userId).first<any>();

    if (!user || user.status !== "Aktif" || user.role_slug === "pending") {
      return new Response(
        JSON.stringify({ success: false, error: "Akun belum disetujui" }),
        { status: 403, headers: JSON_HEADERS },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role_slug,
        sekolahId: user.sekolah_id,
        iat: now,
        exp: now + TOKEN_TTL_SECONDS,
      },
      context.env.JWT_SECRET,
    );

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role_slug,
          wilayah: user.wilayah,
          status: user.status,
          initial: user.initial,
          sekolah_id: user.sekolah_id,
          picture: user.picture,
          sso_id: user.sso_id,
          kelas: user.kelas,
        },
      }),
      { headers: JSON_HEADERS },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Gagal memperbarui sesi",
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
