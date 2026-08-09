import { Link } from "react-router-dom";
import {
  useMemo,
  useState,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Users as UsersIcon,
  UserCheck,
  Store,
  School,
  ChevronRight,
  Wand2,
  Eye,
  EyeOff,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { ButtonPromax } from "../../../../packages/ui/src/ButtonPromax";
import {
  TableSearch,
  TablePagination,
} from "../../../../packages/ui/src/TableControls";
import { SchoolSearchInput } from "../components/SchoolSearchInput";
import type { UserRole } from "@repo/auth";
import { ROLE_LABELS, type SimUser, type UserStatus } from "../data/appData";

type UserFilter = "all" | "agen" | "sekolah" | "guru" | "siswa";
const PAGE_SIZE = 25;

function ActionIcon({ name }: { name: "edit" | "delete" | "view" }) {
  const paths = {
    view: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    ),
  };

  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  );
}

function SliderModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.3s ease-out forwards",
          boxShadow:
            "0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              lineHeight: 1,
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

function InfoModal({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="antigravity-card"
        style={{
          backgroundColor: "var(--bg-card, #fff)",
          padding: 24,
          borderRadius: 12,
          minWidth: 400,
          maxWidth: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <div
          style={{ color: "var(--text-secondary, #666)", fontSize: "0.95rem" }}
        >
          {content}
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}
        >
          <button
            type="button"
            className="action-button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 500,
              border: "none",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="antigravity-card"
        style={{
          backgroundColor: "var(--bg-card, #fff)",
          padding: 24,
          borderRadius: 12,
          minWidth: 400,
          maxWidth: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <div
          style={{
            color: "var(--text-secondary, #666)",
            fontSize: "0.95rem",
            marginBottom: 24,
          }}
        >
          {message}
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <button
            type="button"
            className="action-button"
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 6, fontWeight: 500 }}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-button danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: "8px 16px",
              background: "var(--danger, #ef4444)",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 500,
              border: "none",
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyForm: Omit<SimUser, "id" | "initial" | "color" | "terakhirLogin"> = {
  username: "",
  password: "",
  nama: "",
  role: "siswa",
  wilayah: "",
  status: "Aktif",
  kelas: "",
  nis: "",
  nuptk: "",
  nip: "",
  sekolahId: undefined,
};

export default function Users() {
  const [users, setUsers] = useState<SimUser[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBentukPendidikan, setSelectedBentukPendidikan] =
    useState<string>("");
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<SimUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password }));
    setShowPassword(true);
  };

  const getApiUrl = () => "";

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/users`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const counts = {
    total: users.length,
    aktif: users.filter((u) => u.status === "Aktif").length,
    agen: users.filter((u) => u.role === "agen").length,
    sekolah: users.filter((u) => u.role === "sekolah").length,
    guru: users.filter((u) => u.role === "guru").length,
    siswa: users.filter((u) => u.role === "siswa").length,
  };

  const filters: { id: UserFilter; label: string; count: number }[] = [
    { id: "all", label: "Semua User", count: counts.total },
    { id: "agen", label: "Agen", count: counts.agen },
    { id: "sekolah", label: "Sekolah", count: counts.sekolah },
    { id: "guru", label: "Guru", count: counts.guru },
    { id: "siswa", label: "Siswa", count: counts.siswa },
  ];

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesCategory =
        activeFilter === "all" || user.role === activeFilter;
      const matchesSearch =
        !query ||
        [
          user.nama,
          user.username,
          user.id,
          user.wilayah,
          user.kelas ?? "",
          user.nis ?? "",
          ROLE_LABELS[user.role],
          user.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstRow =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedBentukPendidikan("");
    setFormOpen(true);
  };

  const openEdit = (user: SimUser) => {
    setEditingId(user.id);
    setSelectedBentukPendidikan("");
    setForm({
      username: user.username,
      nama: user.nama,
      role: user.role,
      wilayah: user.wilayah,
      status: user.status,
      kelas: user.kelas ?? "",
      nis: user.nis ?? "",
      nuptk: user.nuptk ?? "",
      nip: user.nip ?? "",
      sekolahId: user.sekolah_id ?? user.sekolahId ?? undefined,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, sekolah_id: form.sekolahId };
    try {
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? `${getApiUrl()}/api/users/${editingId}`
        : `${getApiUrl()}/api/users`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menyimpan data");
      }
      await fetchUsers();
      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan user");
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
      } else {
        alert(data.error || "Gagal menghapus");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-shell">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <MetricCard
          icon={<UsersIcon size={16} />}
          color="#3b82f6"
          bgClass="#eff6ff"
          title="Total User"
          value={String(counts.total)}
          subtitle="User terdaftar aktif"
        />
        <MetricCard
          icon={<UserCheck size={16} />}
          color="#22c55e"
          bgClass="#f0fdf4"
          title="User Aktif"
          value={String(counts.aktif)}
          subtitle="Siap login"
        />
        <MetricCard
          icon={<Store size={16} />}
          color="#f97316"
          bgClass="#fff7ed"
          title="Agen"
          value={String(counts.agen)}
          subtitle="Distributor"
        />
        <MetricCard
          icon={<School size={16} />}
          color="#a855f7"
          bgClass="#faf5ff"
          title="Admin Sekolah"
          value={String(counts.sekolah)}
          subtitle="Unit sekolah"
        />
      </div>

      <GlassCard className="user-management-card" style={{ width: "100%" }}>
        <div className="panel-heading">
          <div>
            <h2>Daftar User</h2>
            <p>Kelola akun superadmin, agen, sekolah, dan siswa dari sistem.</p>
          </div>
          <div className="button-row desktop-only">
            <ButtonPromax onClick={openCreate}>+ Tambah User</ButtonPromax>
          </div>
        </div>

        <div className="mobile-only" style={{ marginBottom: "24px" }}>
          <button
            onClick={openCreate}
            style={{
              width: "100%",
              background: "#40AEF0",
              color: "white",
              fontWeight: 600,
              padding: "14px",
              borderRadius: "1rem",
              boxShadow: "0 4px 14px rgba(64, 174, 240, 0.3)",
              border: "none",
              fontSize: "14px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            + Tambah User Baru
          </button>
        </div>

        <SliderModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          title={editingId ? "Edit User" : "Tambah User Baru"}
        >
          <form
            className="inline-form"
            onSubmit={handleSubmit}
            style={{
              background: "transparent",
              padding: 0,
              border: "none",
              margin: 0,
            }}
          >
            <div className="form-grid">
              <label>
                Nama
                <input
                  className="input-control"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </label>
              <label>
                Username
                <input
                  className="input-control"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-label">
                Password
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <input
                    className="input-control"
                    type={showPassword ? "text" : "password"}
                    value={form.password || ""}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      editingId
                        ? "Kosongkan jika tidak diubah"
                        : "Minimal 6 karakter"
                    }
                    required={!editingId}
                    style={{ flex: 1, paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "56px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    title="Generate Password"
                    style={{
                      background: "var(--brand-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wand2 size={18} />
                  </button>
                </div>
              </label>
              <label>
                Role
                <select
                  className="input-control"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                >
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Institusi
                {["siswa", "sekolah", "guru"].includes(form.role) ? (
                  <SchoolSearchInput
                    value={form.wilayah}
                    onChange={(val, id, school) => {
                      setForm({ ...form, wilayah: val, sekolahId: id });
                      setSelectedBentukPendidikan(
                        school?.bentuk_pendidikan || "",
                      );
                    }}
                  />
                ) : (
                  <input
                    className="input-control"
                    value={form.wilayah}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        wilayah: e.target.value,
                        sekolahId: undefined,
                      })
                    }
                    required
                  />
                )}
              </label>
              {form.role === "siswa" && (
                <>
                  <label>
                    Kelas
                    <select
                      className="input-control"
                      value={form.kelas ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, kelas: e.target.value })
                      }
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {(() => {
                        const bp =
                          selectedBentukPendidikan?.toLowerCase() || "";
                        let opts = [];
                        if (bp.includes("sd") || bp.includes("mi"))
                          opts = [1, 2, 3, 4, 5, 6];
                        else if (bp.includes("smp") || bp.includes("mts"))
                          opts = [7, 8, 9];
                        else if (
                          bp.includes("sma") ||
                          bp.includes("smk") ||
                          bp.includes("ma")
                        )
                          opts = [10, 11, 12];
                        else opts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                        return opts.map((c) => (
                          <option key={c} value={String(c)}>
                            Kelas {c}
                          </option>
                        ));
                      })()}
                    </select>
                  </label>
                  <label>
                    NIS
                    <input
                      className="input-control"
                      value={form.nis ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, nis: e.target.value })
                      }
                      placeholder="23010011"
                      required
                    />
                  </label>
                </>
              )}
              {form.role === "guru" && (
                <>
                  <label>
                    NUPTK
                    <input
                      className="input-control"
                      value={form.nuptk ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, nuptk: e.target.value })
                      }
                      placeholder="Opsional"
                    />
                  </label>
                  <label>
                    NIP
                    <input
                      className="input-control"
                      value={form.nip ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, nip: e.target.value })
                      }
                      placeholder="Opsional"
                    />
                  </label>
                </>
              )}
              <label>
                Status
                <select
                  className="input-control"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as UserStatus })
                  }
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Menunggu Approve">Menunggu Approve</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>
            <div className="button-row" style={{ marginTop: "24px" }}>
              <ButtonPromax type="submit">
                {editingId ? "Simpan Perubahan" : "Simpan User"}
              </ButtonPromax>
              <button
                type="button"
                className="action-button"
                onClick={() => setFormOpen(false)}
              >
                Batal
              </button>
            </div>
          </form>
        </SliderModal>

        <div className="segmented-filter" aria-label="Filter kategori user">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`segment-button ${activeFilter === filter.id ? "active" : ""}`}
              onClick={() => {
                setActiveFilter(filter.id);
                setPage(1);
              }}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        <div
          className="table-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <TableSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Cari nama, username, role, wilayah..."
          />
          <div className="table-summary">
            Menampilkan {firstRow}-{lastRow} dari {filteredUsers.length} user
          </div>
        </div>

        <div className="table-scroll desktop-only users-table-edge-to-edge">
          <table className="table-promax users-table-fixed">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>User</th>
                <th style={{ textAlign: "left" }}>Username</th>
                <th style={{ textAlign: "left" }}>Role</th>
                <th style={{ textAlign: "left" }}>Institusi</th>
                <th style={{ textAlign: "center" }}>Terakhir Login</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th className="users-actions-column" style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div
                      style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: `${user.color}25`,
                          color: user.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {user.initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="users-name-text"
                          title={user.nama}
                          style={{ color: "var(--text-primary)" }}
                        >
                          {user.nama}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="users-username-text"
                    title={user.username}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {user.username}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        background: "rgba(59, 130, 246, 0.12)",
                        color: "var(--accent-primary)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td
                    className="users-institution-cell"
                    style={{
                      color: "var(--text-secondary)",
                      maxWidth: "150px",
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.4",
                      }}
                    >
                      {user.wilayah || "-"}
                    </div>
                  </td>
                  <td
                    className="users-last-login-cell"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      textAlign: "center",
                    }}
                  >
                    {user.terakhirLogin}
                  </td>
                  <td className="users-actions-column" style={{ textAlign: "center" }}>
                    <span
                      role="img"
                      aria-label={user.status}
                      title={user.status}
                      style={{
                        display: "inline-flex",
                        color:
                          user.status === "Aktif"
                            ? "var(--success-color, #22c55e)"
                            : "var(--warning-color, #f59e0b)",
                      }}
                    >
                      {user.status === "Aktif" ? (
                        <CircleCheck size={21} />
                      ) : (
                        <CircleX size={21} />
                      )}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      className="action-group"
                      style={{ justifyContent: "center" }}
                    >
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Lihat ${user.nama}`}
                        title="Lihat"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setViewingUser(user);
                        }}
                      >
                        <ActionIcon name="view" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Edit ${user.nama}`}
                        title="Edit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEdit(user);
                        }}
                      >
                        <ActionIcon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button danger"
                        aria-label={`Hapus ${user.nama}`}
                        title="Hapus"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirmId(user.id);
                        }}
                      >
                        <ActionIcon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mobile-only"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {visibleUsers.map((user) => (
            <div
              key={user.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewingUser(user);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                background: "#f9fafb",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: `${user.color}25`,
                    color: user.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {user.initial}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {user.nama}
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      background: "rgba(59, 130, 246, 0.12)",
                      color: "var(--accent-primary)",
                      marginTop: "2px",
                    }}
                  >
                    {ROLE_LABELS[user.role]}
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  padding: "4px",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <div style={{ marginTop: "18px", textAlign: "right" }}>
          <Link
            to="/"
            style={{
              fontSize: "0.875rem",
              color: "var(--accent-primary)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Kembali ke Dasbor
          </Link>
        </div>
      </GlassCard>

      <InfoModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title={`Detail User: ${viewingUser?.nama}`}
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <strong>ID:</strong> {viewingUser?.id}
            </div>
            <div>
              <strong>Username:</strong> {viewingUser?.username}
            </div>
            <div>
              <strong>Role:</strong>{" "}
              {viewingUser?.role ? ROLE_LABELS[viewingUser.role] : "-"}
            </div>
            <div>
              <strong>Wilayah:</strong> {viewingUser?.wilayah}
            </div>
            {viewingUser?.role === "siswa" && (
              <>
                <div>
                  <strong>Kelas:</strong> {viewingUser?.kelas}
                </div>
                <div>
                  <strong>NIS:</strong> {viewingUser?.nis}
                </div>
              </>
            )}
            <div>
              <strong>Status:</strong> {viewingUser?.status}
            </div>
            <div>
              <strong>Terakhir Login:</strong> {viewingUser?.terakhirLogin}
            </div>
          </div>
        }
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) removeUser(deleteConfirmId);
        }}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}

function MetricCard({
  icon,
  color,
  title,
  value,
  subtitle,
  bgClass,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  value: string;
  subtitle: string;
  bgClass?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "1rem",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        border: "1px solid #f3f4f6",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
          background: bgClass || `${color}1A`,
          color: color,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#1f2937",
          margin: 0,
        }}
      >
        {value}
      </h3>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#4b5563",
          textTransform: "uppercase",
          letterSpacing: "0.025em",
          marginTop: "4px",
          marginBottom: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "9px",
          color: "#9ca3af",
          marginTop: "2px",
          marginBottom: 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
