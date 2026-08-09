import { useState, useEffect, useRef } from "react";
import { useAuth } from "@repo/auth";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { useAppData } from "../data/appData";
import AsyncSelect from "react-select/async";
import { Camera } from "lucide-react";

const normalizeSchoolProfile = (school: any) => ({
  ...school,
  bentuk_pendidikan: school?.bentuk_pendidikan ?? school?.jenjang,
  status_sekolah: school?.status_sekolah ?? school?.status,
  alamat_jalan: school?.alamat_jalan ?? school?.alamat,
  nama_dusun: school?.nama_dusun ?? school?.dusun,
  desa_kelurahan: school?.desa_kelurahan ?? school?.desaKelurahan,
  nomor_telepon: school?.nomor_telepon ?? school?.telepon,
  nomor_fax: school?.nomor_fax ?? school?.fax,
  pd_total: school?.pd_total ?? school?.jumlahSiswa,
  ptk_total: school?.ptk_total ?? school?.jumlahGuru,
});

const loadProfileOrganizations = async (
  inputValue: string,
  tingkat: number,
  parentId?: number | null,
) => {
  if (!inputValue && !parentId) return [];
  try {
    let url = `https://staging.kawalmu.pages.dev/api/organizations?tingkat=${tingkat}&limit=100`;
    if (inputValue) url += `&search=${encodeURIComponent(inputValue)}`;
    if (parentId) url += `&parent_id=${parentId}`;
    const urls = [url];
    if (tingkat === 2) {
      let fallback = "https://staging.kawalmu.pages.dev/api/organizations?tingkat=1&limit=100";
      if (inputValue) fallback += `&search=${encodeURIComponent(inputValue)}`;
      urls.push(fallback);
    }
    const responses = await Promise.all(urls.map((item) => fetch(item)));
    const rows: any[] = [];
    for (const response of responses) {
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) rows.push(...json.data);
    }
    return rows.map((org) => ({ label: org.nama, value: org.nama, id: org.id }));
  } catch {
    return [];
  }
};

export default function SchoolProfile() {
  const { session } = useAuth();
  const { data } = useAppData();

  const [masterSchool, setMasterSchool] = useState<any>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isEditingMissing, setIsEditingMissing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [selectedPwmId, setSelectedPwmId] = useState<number | null>(null);
  const [selectedPdmId, setSelectedPdmId] = useState<number | null>(null);
  const [selectedPcmId, setSelectedPcmId] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const currentUser = session
    ? data.users?.find(
        (u) => u.username?.toLowerCase() === session.username?.toLowerCase(),
      ) ||
      users.find(
        (u) => u.username?.toLowerCase() === session.username?.toLowerCase(),
      )
    : undefined;
  const isSchoolAdmin = session?.role === "sekolah";
  const isStudent = session?.role === "siswa";
  const isGuru = session?.role === "guru";
  const hasAccess = isSchoolAdmin || isStudent || isGuru;
  const schoolName = currentUser?.wilayah || "";
  const linkedSchoolId =
    session?.sekolahId || currentUser?.sekolahId || currentUser?.sekolah_id;
  const school = hasAccess
    ? (data.schools || []).find((s) => s.nama === schoolName)
    : null;

  useEffect(() => {
    if (hasAccess) {
      fetch(`/api/users?limit=2000`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.data) setUsers(res.data);
        })
        .catch((err) => console.error(err));
    }

    if (hasAccess && (linkedSchoolId || schoolName)) {
      setIsLoadingSchool(true);
      fetch(
        linkedSchoolId
          ? `/api/schools?id=${encodeURIComponent(linkedSchoolId)}`
          : `/api/schools?nama=${encodeURIComponent(schoolName)}`,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            setMasterSchool(normalizeSchoolProfile(resData.data));
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setIsLoadingSchool(false);
        });
    }
  }, [hasAccess, linkedSchoolId, schoolName]);

  useEffect(() => {
    if (!masterSchool) return;
    const fields = [
      "nama", "npsn", "jenjang", "status", "alamat", "rt", "rw", "dusun",
      "desaKelurahan", "kecamatan", "kabupaten", "provinsi", "telepon", "fax",
      "email", "website", "akreditasi", "logoUrl", "gmapUrl", "prm", "pcm",
      "pdm", "pwm", "lintang", "bujur",
    ];
    setProfileForm(
      Object.fromEntries(fields.map((key) => [key, String(masterSchool[key] ?? "")])),
    );
  }, [masterSchool]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetch(
          `/api/schools?search=` +
            encodeURIComponent(searchQuery),
        )
          .then((res) => res.json())
          .then((resData) => {
            if (resData.success) setSearchResults(resData.data || []);
          })
          .catch((err) => console.error(err))
          .finally(() => setIsSearching(false));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  if (!session) {
    return null;
  }

  const handleLinkSchool = async (selectedSchool: any) => {
    setIsLinking(true);

    if (currentUser) {
      try {
        const updatedUser = {
          ...currentUser,
          wilayah: selectedSchool.nama,
          sekolahId: selectedSchool.id,
          sekolah_id: selectedSchool.id,
        };
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/api/users`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedUser),
          },
        );

        if (res.ok) {
          // Success, update local UI
          setMasterSchool(selectedSchool);
        } else {
          console.error("Failed to link school");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Fallback if no currentUser found
      setMasterSchool(selectedSchool);
    }

    setIsLinking(false);
  };

  const profileFields = [
    ["alamat", "Alamat Lengkap"],
    ["rt", "RT"],
    ["rw", "RW"],
    ["dusun", "Dusun"],
    ["desaKelurahan", "Desa/Kelurahan"],
    ["kecamatan", "Kecamatan"],
    ["kabupaten", "Kabupaten/Kota"],
    ["provinsi", "Provinsi"],
    ["telepon", "Nomor Telepon"],
    ["fax", "Nomor Fax"],
    ["email", "Email Sekolah"],
    ["website", "Website"],
    ["pwm", "PWM"],
    ["pdm", "PDM"],
    ["pcm", "PCM"],
    ["prm", "PRM"],
    ["lintang", "Lintang"],
    ["bujur", "Bujur"],
    ["gmapUrl", "Tautan Google Maps"],
  ] as const;

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !masterSchool?.id) return;
    setProfileMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileMessage("Logo harus berformat JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage("Ukuran logo maksimal 2 MB.");
      return;
    }
    setIsUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/school-logo/${masterSchool.id}`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Upload logo gagal.");
      setMasterSchool((current: any) => ({ ...current, logoUrl: result.url }));
      setProfileForm((current) => ({ ...current, logoUrl: result.url }));
      setProfileMessage("Logo sekolah berhasil diperbarui.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Upload logo gagal.");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const saveMissingProfile = async () => {
    if (!masterSchool?.id) return;
    setIsSavingProfile(true);
    setProfileMessage("");
    try {
      const payload = Object.fromEntries(
        profileFields.map(([key]) => [key, String(profileForm[key] ?? "").trim()]),
      );
      const response = await fetch(`/api/schools/${masterSchool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan profil sekolah.");
      }
      const refreshed = await fetch(`/api/schools?id=${masterSchool.id}`, { cache: "no-store" }).then((res) => res.json());
      if (refreshed.success) setMasterSchool(normalizeSchoolProfile(refreshed.data));
      setIsEditingMissing(false);
      setProfileMessage("Data sekolah berhasil dilengkapi.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Gagal menyimpan profil sekolah.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: hasAccess ? "1000px" : "600px",
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
        Profil Sekolah
      </h1>

      {hasAccess && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {isLoadingSchool ? (
            <GlassCard
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Memuat data master sekolah...
            </GlassCard>
          ) : masterSchool ? (
            <>
              {/* Hero/Identitas Utama Card */}
              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "1.25rem",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-1.5rem",
                    right: "-1.5rem",
                    width: "6rem",
                    height: "6rem",
                    background: "#eff6ff",
                    borderRadius: "9999px",
                    filter: "blur(24px)",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-1.5rem",
                    left: "-1.5rem",
                    width: "6rem",
                    height: "6rem",
                    background: "#eff6ff",
                    borderRadius: "9999px",
                    filter: "blur(24px)",
                  }}
                ></div>

                <div style={{ position: "relative", zIndex: 10 }}>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    style={{ display: "none" }}
                  />
                  <div
                    role={isSchoolAdmin ? "button" : undefined}
                    tabIndex={isSchoolAdmin ? 0 : undefined}
                    title={isSchoolAdmin ? "Ubah logo sekolah" : undefined}
                    onClick={() => isSchoolAdmin && !isUploadingLogo && logoInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (isSchoolAdmin && !isUploadingLogo && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        logoInputRef.current?.click();
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "4rem",
                      height: "4rem",
                      background: "#eff6ff",
                      color: "#3B82F6",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 0.75rem auto",
                      fontSize: "1.5rem",
                      boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                      border: "1px solid #dbeafe",
                      cursor: isSchoolAdmin && !isUploadingLogo ? "pointer" : "default",
                      opacity: isUploadingLogo ? 0.55 : 1,
                    }}
                  >
                    {masterSchool.logoUrl ? (
                      <img src={masterSchool.logoUrl} alt={`Logo ${masterSchool.nama}`} style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} />
                    ) : (
                      <i className="fa-solid fa-school"></i>
                    )}
                    {isSchoolAdmin && (
                      <span style={{ position: "absolute", right: "-3px", bottom: "-3px", width: "22px", height: "22px", borderRadius: "9999px", background: "#0ea5e9", color: "white", display: "grid", placeItems: "center", boxShadow: "0 2px 5px rgba(0,0,0,.22)" }}>
                        <Camera size={12} />
                      </span>
                    )}
                  </div>
                  <h2
                    style={{
                      fontSize: "17px",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                      lineHeight: 1.375,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {masterSchool.nama}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#F1F5F9",
                        color: "#4b5563",
                        fontSize: "10px",
                        fontWeight: "bold",
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <i
                        className="fa-regular fa-id-badge"
                        style={{ color: "#9ca3af" }}
                      ></i>{" "}
                      NPSN: {masterSchool.npsn || "-"}
                    </span>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#fffbeb",
                        color: "#d97706",
                        border: "1px solid #fef3c7",
                        fontSize: "10px",
                        fontWeight: "bold",
                        borderRadius: "9999px",
                      }}
                    >
                      {masterSchool.status_sekolah || "SWASTA"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistik (Grid 2 Kolom) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Card Siswa */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "1rem",
                    borderRadius: "1rem",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      background: "#e0e7ff",
                      color: "#6366f1",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        margin: 0,
                      }}
                    >
                      Total Siswa
                    </p>
                    <p
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                        marginTop: "0.125rem",
                        marginBottom: 0,
                      }}
                    >
                      {masterSchool.pd_total ?? "-"}
                    </p>
                  </div>
                </div>
                {/* Card Guru */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "1rem",
                    borderRadius: "1rem",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      background: "#d1fae5",
                      color: "#10b981",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-chalkboard-user"></i>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        margin: 0,
                      }}
                    >
                      Total Guru
                    </p>
                    <p
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                        marginTop: "0.125rem",
                        marginBottom: 0,
                      }}
                    >
                      {masterSchool.ptk_total ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informasi Umum */}
              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "1.25rem",
                }}
              >
                <h3
                  style={{
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: "0 0 1rem 0",
                  }}
                >
                  <i
                    className="fa-solid fa-circle-info"
                    style={{ color: "#3B82F6" }}
                  ></i>{" "}
                  Informasi Umum
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Bentuk Pendidikan
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {masterSchool.bentuk_pendidikan || "-"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Akreditasi
                    </span>
                    <span
                      style={{
                        padding: "0.125rem 0.625rem",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "11px",
                        fontWeight: "bold",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {masterSchool.akreditasi || "-"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Agen Distributor
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#9ca3af",
                      }}
                    >
                      {school?.agen || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Lokasi */}
              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "1.25rem",
                }}
              >
                <h3
                  style={{
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: "0 0 1rem 0",
                  }}
                >
                  <i
                    className="fa-solid fa-location-dot"
                    style={{ color: "#ef4444" }}
                  ></i>{" "}
                  Detail Lokasi
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        color: "#9ca3af",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Alamat Lengkap
                    </span>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.625,
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {masterSchool.alamat_jalan}
                      {masterSchool.rt ? ` RT ${masterSchool.rt}` : ""}
                      {masterSchool.rw ? ` RW ${masterSchool.rw}` : ""}
                      {masterSchool.desa_kelurahan
                        ? `, ${masterSchool.desa_kelurahan}`
                        : ""}
                      {masterSchool.kecamatan
                        ? `, Kec. ${masterSchool.kecamatan}`
                        : ""}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "1rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "10px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          color: "#9ca3af",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Kabupaten/Kota
                      </span>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-primary)",
                          fontWeight: 500,
                          margin: 0,
                        }}
                      >
                        {masterSchool.kabupaten || "-"}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "10px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          color: "#9ca3af",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Provinsi
                      </span>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-primary)",
                          fontWeight: 500,
                          margin: 0,
                        }}
                      >
                        {masterSchool.provinsi || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <GlassCard style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1rem" }}>
                      Data Lengkap Sekolah
                    </h3>
                    <p style={{ margin: "5px 0 0", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      Data yang dapat dikelola admin sekolah.
                    </p>
                  </div>
                  {isSchoolAdmin && !isEditingMissing && (
                    <button
                      type="button"
                      className="button-promax"
                      onClick={() => {
                        setProfileMessage("");
                        setIsEditingMissing(true);
                      }}
                    >
                      Edit Data
                    </button>
                  )}
                </div>

                {profileMessage && (
                  <div
                    className={`status-message ${profileMessage.includes("berhasil") ? "success" : "error"}`}
                    style={{ marginBottom: "16px" }}
                  >
                    {profileMessage}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {profileFields.map(([key, label]) => {
                    const currentValue = masterSchool[key];
                    const isMissing =
                      currentValue === null ||
                      currentValue === undefined ||
                      String(currentValue).trim() === "";
                    const canEdit = isSchoolAdmin && isEditingMissing;
                    const isOrganizationField = ["pwm", "pdm", "pcm", "prm"].includes(key);
                    return (
                      <label key={key} style={{ display: "grid", gap: "6px", minWidth: 0 }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                          {label}
                        </span>
                        {canEdit && isOrganizationField ? (
                          <AsyncSelect
                            key={`${key}-${selectedPwmId || "all"}-${selectedPdmId || "all"}-${selectedPcmId || "all"}`}
                            cacheOptions
                            defaultOptions
                            placeholder={`Cari ${label}...`}
                            loadOptions={(input) => {
                              if (key === "pwm") return loadProfileOrganizations(input, 2);
                              if (key === "pdm") return loadProfileOrganizations(input, 3, selectedPwmId);
                              if (key === "pcm") return loadProfileOrganizations(input, 4, selectedPdmId);
                              return loadProfileOrganizations(input, 5, selectedPcmId);
                            }}
                            value={profileForm[key] ? { label: profileForm[key], value: profileForm[key] } : null}
                            onChange={(selected: any) => {
                              const value = selected?.value || "";
                              if (key === "pwm") {
                                setSelectedPwmId(selected?.id || null);
                                setSelectedPdmId(null);
                                setSelectedPcmId(null);
                                setProfileForm((current) => ({ ...current, pwm: value, pdm: "", pcm: "", prm: "" }));
                              } else if (key === "pdm") {
                                setSelectedPdmId(selected?.id || null);
                                setSelectedPcmId(null);
                                setProfileForm((current) => ({ ...current, pdm: value, pcm: "", prm: "" }));
                              } else if (key === "pcm") {
                                setSelectedPcmId(selected?.id || null);
                                setProfileForm((current) => ({ ...current, pcm: value, prm: "" }));
                              } else {
                                setProfileForm((current) => ({ ...current, prm: value }));
                              }
                            }}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isClearable
                            isDisabled={
                              (key === "pdm" && !selectedPwmId) ||
                              (key === "pcm" && !selectedPdmId) ||
                              (key === "prm" && !selectedPcmId)
                            }
                            noOptionsMessage={({ inputValue }) =>
                              inputValue ? "Tidak ditemukan" : "Ketik untuk mencari..."
                            }
                          />
                        ) : canEdit ? (
                          <input
                            className="input-control"
                            value={profileForm[key] || ""}
                            onChange={(event) =>
                              setProfileForm((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder={`Lengkapi ${label.toLowerCase()}`}
                          />
                        ) : (
                          <div
                            style={{
                              minHeight: "42px",
                              padding: "10px 12px",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "8px",
                              background: "var(--bg-tertiary)",
                              color: isMissing ? "var(--text-secondary)" : "var(--text-primary)",
                              fontSize: "0.85rem",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {isMissing ? "Belum diisi" : String(currentValue)}
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>

                {isEditingMissing && (
                  <div className="button-row" style={{ marginTop: "20px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => setIsEditingMissing(false)}
                      disabled={isSavingProfile}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="button-promax"
                      onClick={saveMissingProfile}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                )}
              </GlassCard>
            </>
          ) : hasAccess ? (
            <GlassCard
              style={{
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}
              >
                Sekolah Anda belum terhubung dengan Master Data resmi. Silakan
                cari dan tautkan sekolah Anda di bawah ini:
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama sekolah untuk mencari (minimal 3 huruf)..."
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    width: "100%",
                    outline: "none",
                  }}
                />
                {isSearching && (
                  <div
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Mencari...
                  </div>
                )}
                {isLinking && (
                  <div
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Menautkan...
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      marginTop: "8px",
                      zIndex: 10,
                      maxHeight: "250px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {searchResults.map((res: any) => (
                      <div
                        key={res.id}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                        }}
                        onClick={() => handleLinkSchool(res)}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {res.nama}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          NPSN: {res.npsn || "-"} | {res.kota || res.kabupaten},{" "}
                          {res.provinsi}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              Data profil sekolah belum tersedia.
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
