import { useEffect, useState, useRef } from "react";
import { useAuth } from "@repo/auth";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { Key, Eye, EyeOff, Camera, FileText } from "lucide-react";

export default function Profile() {
  const { session, setCustomSession } = useAuth();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  const [isEditingAdminData, setIsEditingAdminData] = useState(false);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState("");
  const [adminDataSuccess, setAdminDataSuccess] = useState("");
  const [editMasaAktif, setEditMasaAktif] = useState("");
  const [suratTugasFile, setSuratTugasFile] = useState<File | null>(null);
  useEffect(() => {
    if (!session?.username) return;
    fetch("/api/users?limit=2000", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.success || !Array.isArray(payload.data)) return;
        setProfileUser(
          payload.data.find(
            (user: any) =>
              user.username === session.username || user.id === session.id,
          ) || null,
        );
      })
      .catch(() => {});
  }, [session?.id, session?.username]);

  if (!session) {
    return null;
  }

  const isSchoolAdmin = session.role === "sekolah";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session.id) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      const MAX_SIZE = 256;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round(height * (MAX_SIZE / width));
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round(width * (MAX_SIZE / height));
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");

      ctx.drawImage(img, 0, 0, width, height);
      const base64Data = canvas.toDataURL("image/webp", 0.8);
      URL.revokeObjectURL(objectUrl);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || `${""}`}/api/users/${session.id}/picture`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ picture: base64Data }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setCustomSession({
          ...session,
          picture: base64Data,
        });
        alert("Foto profil berhasil diperbarui");
      } else {
        alert(json.error || "Gagal upload foto");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat upload foto");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAdminDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminDataLoading(true);
    setAdminDataError("");
    setAdminDataSuccess("");

    try {
      let finalSuratTugasUrl = profileUser?.suratTugas || "";

      if (suratTugasFile) {
        setAdminDataSuccess("Mengunggah surat tugas...");
        const psRes = await fetch(`/api/upload/presign`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: suratTugasFile.type,
            fileName: suratTugasFile.name,
          }),
        });
        const psJson = await psRes.json();
        if (!psRes.ok || psJson.error) {
          throw new Error(`Gagal menyiapkan upload: ${psJson.error ?? psRes.statusText}`);
        }

        const uploadRes = await fetch(psJson.url, {
          method: "PUT",
          headers: { "Content-Type": suratTugasFile.type },
          body: suratTugasFile,
        });
        if (!uploadRes.ok) {
          throw new Error(`Gagal mengunggah file: ${uploadRes.status} ${uploadRes.statusText}`);
        }
        finalSuratTugasUrl = psJson.mediaPath;
      }

      setAdminDataSuccess("Menyimpan profil...");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/users/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masaAktif: editMasaAktif,
          suratTugas: finalSuratTugasUrl,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAdminDataSuccess("Data berhasil diperbarui!");
        setProfileUser((prev: any) => ({
          ...prev,
          masaAktif: editMasaAktif,
          suratTugas: finalSuratTugasUrl,
        }));
        setTimeout(() => setIsEditingAdminData(false), 2000);
      } else {
        throw new Error(json.error || "Gagal mengubah data");
      }
    } catch (err: any) {
      setAdminDataError(err.message || "Terjadi kesalahan jaringan");
      setAdminDataSuccess("");
    } finally {
      setAdminDataLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || `${""}`}/api/users/${session.id}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setPasswordSuccess("Password berhasil diubah!");
        setNewPassword("");
        setTimeout(() => setIsEditingPassword(false), 2000);
      } else {
        setPasswordError(json.error || "Gagal mengubah password");
      }
    } catch (err) {
      setPasswordError("Terjadi kesalahan jaringan");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: isSchoolAdmin ? "1000px" : "600px",
        margin: "0 auto",
        padding: "24px 0",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "24px",
          color: "var(--text-primary)",
        }}
      >
        Profil Pengguna
      </h1>

      <GlassCard
        style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
            <div
              style={{
                cursor: isUploadingPhoto ? "not-allowed" : "pointer",
                position: "relative",
              }}
              onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
              title="Ubah Foto Profil"
            >
              {session.picture ? (
                <img
                  src={session.picture}
                  alt={session.displayName}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid var(--glass-border)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    opacity: isUploadingPhoto ? 0.5 : 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "var(--brand-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    opacity: isUploadingPhoto ? 0.5 : 1,
                  }}
                >
                  {session.initial}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  background: "#0ea5e9",
                  color: "white",
                  borderRadius: "50%",
                  padding: "6px",
                  display: "flex",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <Camera size={16} />
              </div>
            </div>
          </div>

          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {session.displayName}
            </h2>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "rgba(25, 118, 210, 0.1)",
                color: "var(--brand-primary)",
                borderRadius: "100px",
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              Role:{" "}
              {session.role === "sekolah" ? "Admin Sekolah" : session.role}
            </div>
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--glass-border)",
            margin: "8px 0",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              Email / Username
            </div>
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {session.username}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              Nomor Baku Muhammadiyah (NBM)
            </div>
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {session.nbm || "-"}
            </div>
          </div>
          {session.role === "siswa" && (
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                Kelas
              </div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                {profileUser?.kelas || (session as any).kelas || "-"}
              </div>
            </div>
          )}
          {session.role === "guru" && (
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                Mata Pelajaran
              </div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                {profileUser?.mapel ||
                  profileUser?.kelas ||
                  (session as any).mapel ||
                  "-"}
              </div>
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              Status Akun
            </div>
            <div style={{ fontWeight: 500, color: "var(--success)" }}>
              Aktif
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              Terakhir Login
            </div>
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {new Date(session.loginAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {isSchoolAdmin && (
        <GlassCard
          style={{
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Data Admin Sekolah
            </h3>
            {!isEditingAdminData && (
              <button
                onClick={() => {
                  setEditMasaAktif(profileUser?.masaAktif || "");
                  setSuratTugasFile(null);
                  setIsEditingAdminData(true);
                  setAdminDataError("");
                  setAdminDataSuccess("");
                }}
                style={{
                  padding: "8px 16px",
                  background: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit Data
              </button>
            )}
          </div>

          {!isEditingAdminData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              <div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Masa Aktif:</span>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{profileUser?.masaAktif || "-"}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Surat Tugas:</span>
                <div style={{ fontWeight: 500 }}>
                  {profileUser?.suratTugas ? (
                    <a
                      href={profileUser.suratTugas.startsWith('http') || profileUser.suratTugas.startsWith('/') ? profileUser.suratTugas : `/api/media/${profileUser.suratTugas}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--brand-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      title="Lihat File"
                    >
                      <FileText size={20} />
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminDataSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Masa Aktif
                </label>
                <input
                  type="text"
                  value={editMasaAktif}
                  onChange={(e) => setEditMasaAktif(e.target.value)}
                  disabled={adminDataLoading}
                  placeholder="Contoh: Tahun Ajaran 2024/2025"
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "rgba(15, 23, 42, 0.4)",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Surat Tugas
                </label>
                <input
                  type="file"
                  onChange={(e) => setSuratTugasFile(e.target.files?.[0] || null)}
                  disabled={adminDataLoading}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "rgba(15, 23, 42, 0.4)",
                    color: "white",
                    outline: "none",
                  }}
                />
                {profileUser?.suratTugas && !suratTugasFile && (
                  <div style={{ marginTop: "4px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Biarkan kosong jika tidak ingin mengubah surat tugas saat ini.
                  </div>
                )}
              </div>

              {adminDataError && <div style={{ color: "var(--error)", fontSize: "0.875rem" }}>{adminDataError}</div>}
              {adminDataSuccess && <div style={{ color: "var(--success)", fontSize: "0.875rem" }}>{adminDataSuccess}</div>}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={adminDataLoading}
                  style={{
                    padding: "8px 24px",
                    background: "var(--success)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: adminDataLoading ? "not-allowed" : "pointer",
                    opacity: adminDataLoading ? 0.7 : 1,
                  }}
                >
                  {adminDataLoading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAdminData(false)}
                  disabled={adminDataLoading}
                  style={{
                    padding: "8px 24px",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      )}
      {!session.isSso && session.id && (
        <GlassCard
          style={{
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Key size={20} />
              Keamanan Akun
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
                  const redirectUri = `${window.location.origin}/oauth/callback`;
                  const authorizeUrl = `https://dias.muhammadiyah.or.id/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
                  window.location.href = authorizeUrl;
                }}
                style={{
                  padding: "8px 16px",
                  background: "#f8fafc",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <img
                  src="/muhammadiyah-logo.png"
                  alt="SSO"
                  style={{
                    width: "16px",
                    height: "16px",
                    objectFit: "contain",
                  }}
                />
                Hubungkan SSO
              </button>

              {!isEditingPassword && (
                <button
                  onClick={() => {
                    setIsEditingPassword(true);
                    setPasswordSuccess("");
                    setPasswordError("");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Ubah Password
                </button>
              )}
            </div>
          </div>

          {isEditingPassword && (
            <form
              onSubmit={handleChangePassword}
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  Password Baru
                </label>
                <div style={{ position: "relative", maxWidth: "300px" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      paddingRight: "40px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(15, 23, 42, 0.4)",
                      color: "white",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div style={{ color: "var(--error)", fontSize: "0.875rem" }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ color: "var(--success)", fontSize: "0.875rem" }}>
                  {passwordSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: "8px 24px",
                    background: "var(--success)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: passwordLoading ? "not-allowed" : "pointer",
                    opacity: passwordLoading ? 0.7 : 1,
                  }}
                >
                  {passwordLoading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  disabled={passwordLoading}
                  style={{
                    padding: "8px 24px",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      )}
    </div>
  );
}
