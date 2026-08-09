import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@repo/auth";
import { Files, Play, Gamepad2, Image as ImageIcon, BookOpen, CheckCircle2, XCircle, Eye } from "lucide-react";
import Select from "react-select";
import AsyncSelect from "react-select/async";

import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { Chip } from "../../../../packages/ui/src/Chip";
import { ButtonPromax } from "../../../../packages/ui/src/ButtonPromax";
import {
  TableSearch,
  TablePagination,
} from "../../../../packages/ui/src/TableControls";
import { DeploymentManager } from "../components/DeploymentManager";
import {
  canSuperAdminApproveSubscription,
  type ContentCategory,
  type SimContent,
  type SimSchoolUser,
  formatCurrency,
  formatNumber,
  getBook,
  getSchool,
  nextId,
  useAppData,
  getSchoolLevel,
} from "../data/appData";

export const FEATURE_PAGES_BUILD = "2026-08-09-cache-recovery-1";

const contentCategories: ContentCategory[] = [
  "Teks",
  "Infografi",
  "Video",
  "Games HTML5",
];

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

export function Catalog() {
  const { session } = useAuth();
  const { data } = useAppData();

  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterMapel, setFilterMapel] = useState("");

  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const uniqueMapel = useMemo(
    () =>
      Array.from(
        new Set(books.map((b) => (b.mapel || "").trim()).filter(Boolean)),
      ).sort(),
    [books],
  );
  const uniqueKelas = useMemo(
    () =>
      Array.from(
        new Set(books.map((b) => String(b.kelas || "").trim()).filter(Boolean)),
      ).sort(),
    [books],
  );

  const stats = useMemo(() => {
    const tingkat: Record<string, number> = {
      "SD/MI": 0,
      "SMP/MTS": 0,
      "SMA/MA": 0,
    };
    const mapel: Record<string, number> = {};

    books.forEach((b) => {
      const p = (b.peruntukan || "").toUpperCase();
      if (p.includes("SD") || p.includes("MI")) tingkat["SD/MI"]++;
      else if (p.includes("SMP") || p.includes("MTS")) tingkat["SMP/MTS"]++;
      else if (p.includes("SMA") || p.includes("MA") || p.includes("SMK"))
        tingkat["SMA/MA"]++;

      const m = (b.mapel || "").trim();
      if (m) {
        mapel[m] = (mapel[m] || 0) + 1;
      }
    });

    const sortedMapel = Object.entries(mapel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { tingkat, topMapel: sortedMapel, total: books.length };
  }, [books]);

  const filteredBooks = useMemo(() => {
    let userSchoolLevel: string | null = null;
    if (session?.role === "sekolah" && session.sekolahId) {
      const userSchool = data.schools.find((s) => s.id === session.sekolahId);
      if (userSchool) {
        userSchoolLevel = getSchoolLevel(userSchool.nama);
      }
    }
    if (!userSchoolLevel && session?.wilayah) {
      userSchoolLevel = getSchoolLevel(session.wilayah);
    }

    return books.filter((b) => {
      const bPeruntukan = (b.peruntukan || "").toLowerCase();

      if (userSchoolLevel) {
        const schoolLvl = userSchoolLevel.toLowerCase();
        if (
          schoolLvl === "sd/mi" &&
          !bPeruntukan.includes("sd") &&
          !bPeruntukan.includes("mi")
        )
          return false;
        if (
          schoolLvl === "smp/mts" &&
          !bPeruntukan.includes("smp") &&
          !bPeruntukan.includes("mts")
        )
          return false;
        if (
          schoolLvl === "sma/ma/smk" &&
          !bPeruntukan.includes("sma") &&
          !bPeruntukan.includes("smk") &&
          !bPeruntukan.includes("ma")
        )
          return false;
      }

      if (filterTingkat) {
        const flvl = filterTingkat.toLowerCase();
        if (
          flvl === "sd/mi" &&
          !bPeruntukan.includes("sd") &&
          !bPeruntukan.includes("mi")
        )
          return false;
        if (
          flvl === "smp/mts" &&
          !bPeruntukan.includes("smp") &&
          !bPeruntukan.includes("mts")
        )
          return false;
        if (
          flvl === "sma/ma/smk" &&
          !bPeruntukan.includes("sma") &&
          !bPeruntukan.includes("smk") &&
          !bPeruntukan.includes("ma")
        )
          return false;
      }

      if (filterKelas && String(b.kelas || "").trim() !== filterKelas)
        return false;
      if (filterMapel && (b.mapel || "").trim() !== filterMapel) return false;

      return (
        (b.judul || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn || "").toLowerCase().includes(search.toLowerCase()) ||
        bPeruntukan.includes(search.toLowerCase())
      );
    });
  }, [
    books,
    search,
    filterTingkat,
    filterKelas,
    filterMapel,
    session?.role,
    session?.sekolahId,
    session?.wilayah,
    data.schools,
  ]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredBooks.slice(start, start + itemsPerPage);
  }, [filteredBooks, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterTingkat, filterKelas, filterMapel]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isbnForm, setIsbnForm] = useState("");
  const [tahunTerbit, setTahunTerbit] = useState("");
  const [mapelBuku, setMapelBuku] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [kelas, setKelas] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

  const [viewingBook, setViewingBook] = useState<any>(null);

  const fetchBooks = () => {
    setIsLoading(true);
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setBooks(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveBook = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !isbnForm.trim()) return;

    const payload = {
      isbn: isbnForm,
      judul: title,
      peruntukan: jenjang,
      kelas: kelas,
      terbit: tahunTerbit,
      mapel: mapelBuku,
      cover_url: coverUrl,
    };

    if (editingId) {
      await fetch(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}`}/api/books/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    } else {
      await fetch(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}`}/api/books`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    }

    clearCatalogForm();
    fetchBooks();
  };

  const editBook = (book: any) => {
    setEditingId(book.id);
    setIsbnForm(book.isbn || "");
    setTitle(book.judul || "");
    setJenjang(book.peruntukan || "");
    setKelas(book.kelas || "");
    setTahunTerbit(book.terbit || "");
    setMapelBuku(book.mapel || "");
    setCoverUrl(book.cover_url || "");
    setFormOpen(true);
  };

  const viewBook = (book: any) => {
    setViewingBook(book);
  };

  const handleDeleteClick = (book: any) => {
    setBookToDelete(book);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (bookToDelete) {
      await fetch(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}`}/api/books/${bookToDelete.id}`,
        { method: "DELETE" },
      );
      fetchBooks();
      setBookToDelete(null);
    }
  };

  const clearCatalogForm = () => {
    setEditingId(null);
    setIsbnForm("");
    setTitle("");
    setTahunTerbit("");
    setMapelBuku("");
    setJenjang("");
    setKelas("");
    setCoverUrl("");
    setFormOpen(false);
  };

  const openCreate = () => {
    clearCatalogForm();
    setFormOpen(true);
  };

  return (
    <div className="page-shell">
      <GlassCard className="user-management-card" style={{ width: "100%" }}>
        <div
          className="panel-heading"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2>Master Katalog</h2>
            <p>Kelola katalog buku digital yang tersedia untuk distribusi.</p>
          </div>
          <div className="button-row">
            <ButtonPromax onClick={openCreate}>+ Tambah Buku</ButtonPromax>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "var(--surface-sunken)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              Total Buku
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: "var(--surface-sunken)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Per Tingkatan
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  {stats.tingkat["SD/MI"]}
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
                >
                  SD/MI
                </div>
              </div>
              <div
                style={{ width: "1px", background: "var(--border-subtle)" }}
              ></div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  {stats.tingkat["SMP/MTS"]}
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
                >
                  SMP/MTS
                </div>
              </div>
              <div
                style={{ width: "1px", background: "var(--border-subtle)" }}
              ></div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  {stats.tingkat["SMA/MA"]}
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
                >
                  SMA/MA
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: "var(--surface-sunken)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Top Mapel
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {stats.topMapel.map(([m, count]) => (
                <div
                  key={m}
                  style={{
                    background: "var(--bg-body)",
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "0.875rem",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{m}</span>
                  <span
                    style={{
                      background: "var(--primary-subtle)",
                      color: "var(--primary)",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="table-controls"
          style={{
            marginBottom: 16,
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <TableSearch
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Cari buku berdasarkan judul, ISBN, atau peruntukan..."
            />
          </div>
          <select
            className="input-control"
            style={{ flex: "1 1 140px" }}
            value={filterTingkat}
            onChange={(e) => setFilterTingkat(e.target.value)}
          >
            <option value="">Semua Tingkat</option>
            <option value="SD/MI">SD/MI</option>
            <option value="SMP/MTs">SMP/MTs</option>
            <option value="SMA/MA/SMK">SMA/MA/SMK</option>
          </select>
          <select
            className="input-control"
            style={{ flex: "1 1 140px" }}
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
          <select
            className="input-control"
            style={{ flex: "1 1 140px" }}
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
          >
            <option value="">Semua Mapel</option>
            {uniqueMapel.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          headers={[
            "Thumbnail",
            "ISBN",
            "Judul",
            "Mapel",
            "Peruntukan",
            "Kelas",
            "Terbit",
            "Aksi",
          ]}
          headerAligns={[
            "center",
            "left",
            "left",
            "left",
            "left",
            "center",
            "center",
            "center",
          ]}
        >
          {isLoading ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-secondary)",
                }}
              >
                Memuat data katalog...
              </td>
            </tr>
          ) : paginatedBooks.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-secondary)",
                }}
              >
                Tidak ada buku yang cocok dengan pencarian.
              </td>
            </tr>
          ) : (
            paginatedBooks.map((book) => (
              <tr key={book.id || book.isbn}>
                <td style={{ textAlign: "center" }}>
                  <img
                    className="catalog-thumbnail"
                    src={
                      book.cover_url ||
                      "https://placehold.co/40x56/e2e8f0/475569?text=" +
                        encodeURIComponent(book.judul.substring(0, 3))
                    }
                    alt=""
                    style={{ margin: "0 auto", display: "block" }}
                  />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{book.isbn}</td>
                <td style={{ minWidth: 200 }}>{book.judul}</td>
                <td>{book.mapel || "-"}</td>
                <td>{book.peruntukan || "-"}</td>
                <td style={{ textAlign: "center" }}>{book.kelas || "-"}</td>
                <td style={{ textAlign: "center" }}>{book.terbit || "-"}</td>
                <td style={{ textAlign: "center" }}>
                  <div
                    className="action-group"
                    style={{ justifyContent: "center" }}
                  >
                    <button
                      type="button"
                      className="icon-action-button"
                      aria-label={`Lihat ${book.judul}`}
                      title="Lihat"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        viewBook(book);
                      }}
                    >
                      <ActionSvg name="view" />
                    </button>
                    <button
                      type="button"
                      className="icon-action-button"
                      aria-label={`Edit ${book.judul}`}
                      title="Edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editBook(book);
                      }}
                    >
                      <ActionSvg name="edit" />
                    </button>
                    <button
                      type="button"
                      className="icon-action-button danger"
                      aria-label={`Hapus ${book.judul}`}
                      title="Hapus"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(book);
                      }}
                    >
                      <ActionSvg name="delete" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </DataTable>

        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </GlassCard>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Buku"
        message={`Apakah Anda yakin ingin menghapus buku "${bookToDelete?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <InfoModal
        isOpen={!!viewingBook}
        onClose={() => setViewingBook(null)}
        title="Detail Buku"
        content={
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <img
                src={
                  viewingBook?.cover_url ||
                  "https://placehold.co/120x160/e2e8f0/475569?text=" +
                    encodeURIComponent(
                      (viewingBook?.judul || "").substring(0, 20),
                    )
                }
                alt="Cover"
                style={{
                  height: 160,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            </div>
            <div>
              <strong>Judul:</strong> {viewingBook?.judul}
            </div>
            <div>
              <strong>ISBN:</strong> {viewingBook?.isbn}
            </div>
            <div>
              <strong>Mapel:</strong> {viewingBook?.mapel || "-"}
            </div>
            <div>
              <strong>Peruntukan:</strong> {viewingBook?.peruntukan || "-"}
            </div>
            <div>
              <strong>Kelas:</strong> {viewingBook?.kelas || "-"}
            </div>
            <div>
              <strong>Tahun Terbit:</strong> {viewingBook?.terbit || "-"}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="action-button"
                onClick={() => setViewingBook(null)}
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
        }
      />

      {isFormOpen && (
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
          onClick={clearCatalogForm}
        >
          <div
            className="antigravity-card"
            style={{
              backgroundColor: "var(--bg-card, #fff)",
              padding: 24,
              borderRadius: 12,
              minWidth: 500,
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
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
                {editingId ? "Edit Buku" : "Tambah Buku Baru"}
              </h3>
              <button
                type="button"
                onClick={clearCatalogForm}
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
            <form onSubmit={saveBook}>
              <div className="form-grid">
                <label>
                  ISBN
                  <input
                    className="input-control"
                    value={isbnForm}
                    onChange={(e) => setIsbnForm(e.target.value)}
                    placeholder="Misal: 978-623-..."
                    required
                  />
                </label>
                <label>
                  Judul Buku
                  <input
                    className="input-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Fikih SMA Kelas X"
                    required
                  />
                </label>
                <label>
                  Peruntukan
                  <select
                    className="input-control"
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value)}
                    required
                  >
                    <option value="">Pilih Peruntukan</option>
                    <option value="SD/MI">SD/MI</option>
                    <option value="SMP/MTS">SMP/MTS</option>
                    <option value="SMA/MA">SMA/MA</option>
                  </select>
                </label>
                <label>
                  Kelas
                  <select
                    className="input-control"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1)
                      .filter((k) => {
                        if (!jenjang) return true;
                        const j = jenjang.toLowerCase();
                        if (j.includes("sd") || j.includes("mi"))
                          return k >= 1 && k <= 6;
                        if (j.includes("smp") || j.includes("mts"))
                          return k >= 7 && k <= 9;
                        if (
                          j.includes("sma") ||
                          j.includes("ma") ||
                          j.includes("smk")
                        )
                          return k >= 10 && k <= 12;
                        return true;
                      })
                      .map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Mata Pelajaran
                  <input
                    className="input-control"
                    list="mapel-options"
                    value={mapelBuku}
                    onChange={(e) => setMapelBuku(e.target.value)}
                    placeholder="Pilih atau ketik baru (misal: Matematika)"
                  />
                  <datalist id="mapel-options">
                    {uniqueMapel.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Tahun Terbit
                  <input
                    className="input-control"
                    value={tahunTerbit}
                    onChange={(e) => setTahunTerbit(e.target.value)}
                    placeholder="Misal: 2026"
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Upload Cover (Opsional)
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                    />
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt="Preview"
                        style={{ height: 60, borderRadius: 4 }}
                      />
                    )}
                  </div>
                </label>
              </div>
              <div
                className="button-row"
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  className="action-button"
                  onClick={clearCatalogForm}
                >
                  Batal
                </button>
                <ButtonPromax type="submit">
                  {editingId ? "Simpan Perubahan" : "Tambah Buku"}
                </ButtonPromax>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function UploadContent() {
  const { data, setData, isLoading, isBgLoading } = useAppData();
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [masterBooks, setMasterBooks] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const availableKelas = Array.from(
    new Set(masterBooks.map((b) => b.kelas).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const [isbn, setIsbn] = useState("");
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<ContentCategory>("Video");
  const [mapel, setMapel] = useState("");
  const [bab, setBab] = useState("");
  const [target, setTarget] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailName, setThumbnailName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "idle" | "uploading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const editingContent = useMemo(
    () => data.contents.find((item) => item.id === editingContentId) ?? null,
    [data.contents, editingContentId],
  );

  useEffect(() => {
    let active = true;
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
    )
      .then((response) => response.json())
      .then((payload) => {
        if (!active || !payload?.success || !Array.isArray(payload.data))
          return;
        setMasterBooks(
          payload.data.sort((a: any, b: any) =>
            a.judul.localeCompare(b.judul, "id"),
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editingContentId) return;
    const requestedId = new URLSearchParams(window.location.search).get("edit");
    if (!requestedId) return;
    const existing = data.contents.find((item) => item.id === requestedId);
    if (!existing) return;
    setEditingContentId(existing.id);
    setJudul(existing.judul);
    setKategori(existing.kategori);
    setIsbn(existing.isbn ?? "");
    setMapel(existing.mapel);
    setBab(existing.bab ? String(existing.bab) : "");
    setTarget(existing.target);
    setDeskripsi(existing.deskripsi ?? "");
    setThumbnailUrl(existing.thumbnailUrl ?? "");
    setThumbnailName(existing.thumbnailUrl ? "Thumbnail tersimpan" : "");
  }, [data.contents, editingContentId]);

  const clearContentForm = () => {
    setEditingContentId(null);
    setJudul("");
    setKategori("Video");
    setIsbn("");
    setMapel("");
    setBab("");
    setTarget("");
    setDeskripsi("");
    setThumbnailUrl("");
    setThumbnailName("");
    setThumbnailFile(null);
    setContentFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleThumbnailChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const url = await fileToDataUrl(file);
    setThumbnailUrl(url);
    setThumbnailName(file.name);
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadeddata = () => {
        // seek to 1 second, or halfway if shorter than 2s
        video.currentTime = Math.min(1, video.duration / 2 || 0);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal memuat video untuk thumbnail"));
      };
    });
  };

  const handleContentFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setContentFile(null);
      return;
    }

    // Validasi format video — hanya MP4 dan WebM yang didukung
    if (
      file.type.startsWith("video/") &&
      file.type !== "video/mp4" &&
      file.type !== "video/webm"
    ) {
      const ext = file.name.split(".").pop()?.toUpperCase() ?? file.type;
      setUploadStatus({
        type: "error",
        message: `Format video "${ext}" tidak didukung dan tidak dapat diputar di browser. Hanya MP4 dan WebM yang diperbolehkan. Konversi file terlebih dahulu menggunakan HandBrake atau FFmpeg.`,
      });
      // Reset input
      event.target.value = "";
      setContentFile(null);
      return;
    }

    setContentFile(file);

    // Auto generate thumbnail if none selected
    if (!thumbnailUrl && !thumbnailFile) {
      if (file.type.startsWith("video/")) {
        try {
          const url = await generateVideoThumbnail(file);
          setThumbnailUrl(url);
          setThumbnailName(`auto_${file.name}.jpg`);
        } catch (e) {
          console.error("Gagal membuat thumbnail video:", e);
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const url = await fileToDataUrl(file);
          setThumbnailUrl(url);
          setThumbnailName(`auto_${file.name}`);
        } catch (e) {
          console.error("Gagal memuat thumbnail gambar:", e);
        }
      }
    }
  };

  const submitContent = async (event: FormEvent) => {
    event.preventDefault();
    if (!judul.trim() || (!contentFile && !editingContent?.sourceUrl)) {
      setUploadStatus({
        type: "error",
        message: "Judul dan file konten wajib diisi untuk konten baru.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({
      type: "uploading",
      message: "Menyiapkan upload ke penyimpanan aman...",
    });

    try {
      let finalThumbnailUrl =
        thumbnailUrl || editingContent?.thumbnailUrl || "";
      if (thumbnailFile) {
        setUploadStatus({
          type: "uploading",
          message: "Mengunggah thumbnail ke R2...",
        });
        const psRes = await fetch(`/api/upload/presign`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: thumbnailFile.type,
            fileName: thumbnailFile.name,
          }),
        });
        const psJson = await psRes.json();
        if (!psRes.ok || psJson.error)
          throw new Error(
            `Gagal menyiapkan thumbnail: ${psJson.error ?? psRes.statusText}`,
          );

        const uploadRes = await fetch(psJson.url, {
          method: "PUT",
          headers: { "Content-Type": thumbnailFile.type },
          body: thumbnailFile,
        });
        if (!uploadRes.ok)
          throw new Error(
            `Gagal mengunggah thumbnail: ${uploadRes.status} ${uploadRes.statusText}`,
          );
        finalThumbnailUrl = psJson.mediaPath;
      }

      let finalSourceUrl = editingContent?.sourceUrl || "";
      let finalFileName = editingContent?.fileName || "";
      if (contentFile) {
        const contentType = getUploadContentType(contentFile, kategori);
        finalFileName =
          contentFile.name
            .replace(/\.[^.]+$/, "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") +
          (contentFile.name.match(/\.[^.]+$/)?.[0].toLowerCase() ?? "");
        setUploadStatus({
          type: "uploading",
          message: `Mengunggah ${kategori.toLowerCase()} ke R2...`,
        });
        const psRes = await fetch(`/api/upload/presign`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType, fileName: finalFileName }),
        });
        const psJson = await psRes.json();
        if (!psRes.ok || psJson.error)
          throw new Error(
            `Gagal menyiapkan file: ${psJson.error ?? psRes.statusText}`,
          );

        const uploadRes = await fetch(psJson.url, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: contentFile,
        });
        if (!uploadRes.ok)
          throw new Error(
            `Gagal mengunggah file: ${uploadRes.status} ${uploadRes.statusText}`,
          );

        finalSourceUrl = psJson.mediaPath;
        finalFileName = finalFileName || psJson.filename;
      }

      setUploadStatus({
        type: "uploading",
        message: "Menyimpan metadata konten ke D1...",
      });
      const savedId = editingContentId || `CNT-${Date.now()}`;
      const contentRecord: SimContent = {
        id: savedId,
        judul: judul.trim(),
        kategori,
        mapel: mapel.trim() || "Umum",
        bab: bab ? Number(bab) : undefined,
        target: target.trim() || "Semua jenjang",
        fileName: finalFileName || `${judul.trim()}.bin`,
        deskripsi: deskripsi.trim() || undefined,
        thumbnailUrl: finalThumbnailUrl || undefined,
        status: editingContent?.status ?? "Siap Review",
        tanggal:
          editingContent?.tanggal ?? new Date().toISOString().slice(0, 10),
        previewMode: previewModeForCategory(kategori),
        thumbnailKey: thumbnailKeyForCategory(kategori),
        protectedPreview: true,
        sourceUrl: finalSourceUrl,
        isbn: isbn.trim() || undefined,
      };

      const metadataResponse = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentRecord),
      });
      const metadataPayload = await metadataResponse.json().catch(() => ({}));
      if (!metadataResponse.ok || metadataPayload.error) {
        throw new Error(
          `File sudah diunggah, tetapi metadata gagal disimpan: ${metadataPayload.error ?? metadataResponse.statusText}`,
        );
      }

      await setData((current) => ({
        ...current,
        contents: editingContentId
          ? current.contents.map((item) =>
              item.id === savedId ? contentRecord : item,
            )
          : [
              contentRecord,
              ...current.contents.filter((item) => item.id !== savedId),
            ],
      }));

      setUploadStatus({
        type: "success",
        message: editingContentId
          ? "Perubahan konten berhasil disimpan."
          : "Konten berhasil diunggah dan tersimpan di D1. Konten sudah muncul di daftar.",
      });
      window.history.replaceState({}, "", "/upload-content");
      clearContentForm();
    } catch (err) {
      setUploadStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : `Upload gagal: ${String(err)}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="page-shell"
      style={{
        padding: 0,
        background: "transparent",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          padding: "16px 20px 8px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "1rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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
              background: "#eff6ff",
              color: "#3b82f6",
            }}
          >
            <Files size={16} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
              margin: 0,
            }}
          >
            {(isLoading || isBgLoading) && data.contents.length === 0 ? "..." : data.contents.length}
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
            Total Konten
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "1rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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
              background: "#fef2f2",
              color: "#ef4444",
            }}
          >
            <Play size={16} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
              margin: 0,
            }}
          >
            {(isLoading || isBgLoading) && data.contents.length === 0 ? "..." : data.contents.filter((c) => c.kategori === "Video").length}
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
            Video
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "1rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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
              background: "#f5f3ff",
              color: "#8b5cf6",
            }}
          >
            <Gamepad2 size={16} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
              margin: 0,
            }}
          >
            {(isLoading || isBgLoading) && data.contents.length === 0 ? "..." : data.contents.filter((c) => c.kategori === "Games HTML5").length}
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
            Games
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "1rem",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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
              background: "#fffbeb",
              color: "#f59e0b",
            }}
          >
            <ImageIcon size={16} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
              margin: 0,
            }}
          >
            {(isLoading || isBgLoading) && data.contents.length === 0 ? "..." : data.contents.filter((c) => c.kategori === "Infografi" || c.kategori === "Teks").length}
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
            Infografis
          </p>
        </div>
      </div>

      <form
        className="inline-form upload-editor-form"
        onSubmit={submitContent}
        style={{ padding: "8px 20px 24px" }}
      >
        <div className="upload-editor-grid">
          <section className="upload-cover-panel">
            <div className="upload-section-heading">
              <span
                className="preview-kicker"
                style={{
                  color: "#40AEF0",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                }}
              >
                Langkah 1
              </span>
              <h3>Thumbnail Konten</h3>
              <p>
                Gunakan thumbnail agar konten mudah dikenali di katalog dan
                player.
              </p>
            </div>

            <div className="upload-thumbnail-stage">
              <img
                src={
                  thumbnailUrl ||
                  thumbnailDraftSrc(
                    kategori,
                    judul || "Konten Demo",
                    target || "Preview",
                  )
                }
                alt=""
              />
              <div className="upload-thumbnail-badge">
                {thumbnailName || "Preview otomatis"}
              </div>
            </div>

            <div className="upload-thumbnail-actions">
              <input
                ref={thumbnailInputRef}
                className="sr-file-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
              <ButtonPromax
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                Pilih Thumbnail
              </ButtonPromax>
              {thumbnailUrl && (
                <button
                  type="button"
                  className="action-button"
                  onClick={() => {
                    setThumbnailUrl("");
                    setThumbnailName("");
                    setThumbnailFile(null);
                    if (thumbnailInputRef.current)
                      thumbnailInputRef.current.value = "";
                  }}
                >
                  Hapus Thumbnail
                </button>
              )}
            </div>
          </section>

          <section className="upload-meta-panel">
            <div className="upload-section-heading">
              <span
                className="preview-kicker"
                style={{
                  color: "#40AEF0",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                }}
              >
                Langkah 2
              </span>
              <h3>Isi Metadata</h3>
              <p>Lengkapi informasi konten di bawah ini sebelum di-publish.</p>
            </div>
            <div className="form-stack">
              <label>
                Judul Konten
                <input
                  className="input-control"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Game Pecahan Kelas V"
                  required
                />
              </label>
              <div className="form-grid">
                <label>
                  Kategori
                  <select
                    className="input-control"
                    value={kategori}
                    onChange={(e) =>
                      setKategori(e.target.value as ContentCategory)
                    }
                  >
                    {contentCategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Bab
                  <select
                    className="input-control"
                    value={bab}
                    onChange={(event) => setBab(event.target.value)}
                  >
                    <option value="">Tanpa Bab</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item}>Bab {item}</option>
                    ))}
                  </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Kelas
                  <select
                    className="input-control"
                    value={selectedKelas}
                    onChange={(e) => {
                      setSelectedKelas(e.target.value);
                      setIsbn("");
                      setMapel("");
                      setTarget("");
                    }}
                  >
                    <option value="">Semua Kelas</option>
                    {availableKelas.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Buku Induk
                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    options={masterBooks
                      .filter(
                        (b) => !selectedKelas || b.kelas === selectedKelas,
                      )
                      .map((b) => ({
                        value: b.isbn,
                        label: `${b.judul} (${b.mapel} - ${b.jenjang || b.peruntukan || "-"})`,
                      }))}
                    value={
                      isbn
                        ? {
                            value: isbn,
                            label: masterBooks.find((b) => b.isbn === isbn)
                              ? `${masterBooks.find((b) => b.isbn === isbn)?.judul} (${masterBooks.find((b) => b.isbn === isbn)?.mapel} - ${masterBooks.find((b) => b.isbn === isbn)?.jenjang || masterBooks.find((b) => b.isbn === isbn)?.peruntukan || "-"})`
                              : isbn,
                          }
                        : null
                    }
                    onChange={(sel) => {
                      const val = sel?.value || "";
                      setIsbn(val);
                      const book = masterBooks.find((b) => b.isbn === val);
                      if (book) {
                        setMapel(book.mapel);
                        setTarget(book.jenjang || book.peruntukan || "-");
                      } else {
                        setMapel("");
                        setTarget("");
                      }
                    }}
                    placeholder="Pilih buku induk..."
                    isClearable
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Deskripsi Konten
                  <textarea
                    className="input-control"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Jelaskan isi, tujuan pembelajaran, dan materi yang dibahas..."
                    rows={4}
                  />
                </label>
                <label>
                  Upload File Utama (Wajib)
                  <input
                    type="file"
                    className="input-control"
                    style={{ paddingTop: 6 }}
                    accept={contentAcceptForCategory(kategori)}
                    onChange={handleContentFileChange}
                    required={!editingContentId}
                  />
                </label>
              </div>
            </div>
            <div className="button-row upload-actions">
              <ButtonPromax type="submit" disabled={isUploading}>
                {isUploading
                  ? "Sedang Menyimpan..."
                  : editingContentId
                    ? "Simpan Perubahan"
                    : "Upload Konten"}
              </ButtonPromax>
              <button
                type="button"
                className="action-button"
                onClick={clearContentForm}
                disabled={isUploading}
              >
                Batal
              </button>
            </div>
            {uploadStatus.type !== "idle" && (
              <div
                className={`upload-status upload-status-${uploadStatus.type}`}
                role={uploadStatus.type === "error" ? "alert" : "status"}
              >
                <span aria-hidden="true">
                  {uploadStatus.type === "success"
                    ? "✓"
                    : uploadStatus.type === "error"
                      ? "!"
                      : "…"}
                </span>
                {uploadStatus.message}
              </div>
            )}
          </section>
        </div>
      </form>
    </div>
  );
}

export function PlayKonten() {
  const { data, setData } = useAppData();
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [page, setPage] = useState(1);
  const [playingContent, setPlayingContent] = useState<SimContent | null>(null);
  const [editingContent, setEditingContent] = useState<SimContent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ContentCategory>("Teks");
  const [editBab, setEditBab] = useState("");
  const [editMapel, setEditMapel] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editIsbn, setEditIsbn] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [masterBooks, setMasterBooks] = useState<any[]>([]);
  const [editSelectedKelas, setEditSelectedKelas] = useState("");
  const editAvailableKelas = Array.from(
    new Set(masterBooks.map((b) => b.kelas).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  useEffect(() => {
    let active = true;
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
    )
      .then((response) => response.json())
      .then((payload) => {
        if (!active || !payload?.success || !Array.isArray(payload.data))
          return;
        setMasterBooks(
          payload.data.sort((a: any, b: any) =>
            a.judul.localeCompare(b.judul, "id"),
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 10;

  // JS-based responsive: prevents mobile DOM from loading on desktop (fixes hang)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  const [isStandalonePwa, setIsStandalonePwa] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true),
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        handler as (e: MediaQueryListEvent) => void,
      );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const syncStandalone = () =>
      setIsStandalonePwa(
        mq.matches ||
          (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true,
      );
    syncStandalone();
    mq.addEventListener("change", syncStandalone);
    return () => mq.removeEventListener("change", syncStandalone);
  }, []);

  useEffect(() => {
    if (
      selectedContentId &&
      !data.contents.some((content) => content.id === selectedContentId)
    ) {
      setSelectedContentId("");
    }
  }, [data.contents, selectedContentId]);

  const mapelOptions = useMemo(() => {
    const fromMaster = masterBooks.map((b: any) => b.mapel).filter(Boolean);
    const fromContents = data.contents.map((c) => c.mapel).filter(Boolean);
    return Array.from(new Set([...fromMaster, ...fromContents]))
      .map(String)
      .sort((a, b) => a.localeCompare(b));
  }, [masterBooks, data.contents]);

  const normalizeTingkat = (t: string) => {
    if (!t || typeof t !== "string") return "";
    const upper = t.toUpperCase();
    if (upper === "SD/MI") return "SD/MI";
    if (upper === "SMP/MTS") return "SMP/MTs";
    if (upper === "SMA/MA" || upper === "SMA/MA/SMK") return "SMA/MA/SMK";
    return t;
  };

  const tingkatOptions = useMemo(() => {
    const fromMaster = masterBooks
      .map((b: any) =>
        b.peruntukan && typeof b.peruntukan === "string"
          ? b.peruntukan.replace(/untuk /i, "").trim()
          : "",
      )
      .filter(Boolean);
    const fromContents = data.contents.map((c) => c.target).filter(Boolean);
    const all = [...fromMaster, ...fromContents].map(normalizeTingkat);
    return Array.from(new Set(all))
      .map(String)
      .sort((a, b) => a.localeCompare(b));
  }, [masterBooks, data.contents]);

  const filteredContents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.contents.filter((content) => {
      const matchesSearch =
        !query ||
        [
          content.judul,
          content.id,
          content.mapel,
          content.target,
          content.kategori,
        ].some(
          (value) =>
            typeof value === "string" && value.toLowerCase().includes(query),
        );
      return (
        matchesSearch &&
        (!kelasFilter || normalizeTingkat(content.target) === kelasFilter) &&
        (!mapelFilter || content.mapel === mapelFilter) &&
        (!kategoriFilter || content.kategori === kategoriFilter)
      );
    });
  }, [data.contents, kelasFilter, kategoriFilter, mapelFilter, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredContents.length / itemsPerPage),
  );
  const paginatedContents = useMemo(
    () =>
      filteredContents.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredContents, page],
  );

  const stats = useMemo(
    () => {
      console.log("PlayKonten calculating stats. Data contents length:", data.contents.length);
      return {
        total: data.contents.length,
        video: data.contents.filter((c) => c.kategori === "Video").length,
        games: data.contents.filter((c) => c.kategori === "Games HTML5").length,
        teksInfo: data.contents.filter(
          (c) => c.kategori === "Teks" || c.kategori === "Infografi",
        ).length,
      };
    },
    [data.contents],
  );

  useEffect(() => {
    setPage(1);
  }, [search, kelasFilter, kategoriFilter, mapelFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openEditModal = (content: SimContent) => {
    setEditingContent(content);
    setEditTitle(content.judul);
    setEditCategory(content.kategori);
    setEditBab(content.bab ? String(content.bab) : "");
    setEditMapel(content.mapel);
    setEditTarget(content.target);
    setEditIsbn(content.isbn || "");
    const bookForEdit = masterBooks.find((b) => b.isbn === content.isbn);
    setEditSelectedKelas(bookForEdit?.kelas || "");
    setEditDeskripsi(content.deskripsi || "");
    setEditThumbnailFile(null);
    setEditThumbnailPreview(content.thumbnailUrl || "");
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingContent || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      let finalThumbnailUrl = editingContent.thumbnailUrl || "";
      if (editThumbnailFile) {
        const psRes = await fetch(`/api/upload/presign`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: editThumbnailFile.type,
            fileName: editThumbnailFile.name,
          }),
        });
        const psJson = await psRes.json();
        if (!psRes.ok || psJson.error)
          throw new Error(
            `Gagal menyiapkan thumbnail: ${psJson.error ?? psRes.statusText}`,
          );

        const uploadRes = await fetch(psJson.url, {
          method: "PUT",
          headers: { "Content-Type": editThumbnailFile.type },
          body: editThumbnailFile,
        });
        if (!uploadRes.ok)
          throw new Error(
            `Gagal mengunggah thumbnail: ${uploadRes.status} ${uploadRes.statusText}`,
          );
        finalThumbnailUrl = psJson.mediaPath;
      }

      const response = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingContent,
          judul: editTitle.trim(),
          kategori: editCategory,
          bab: editBab ? Number(editBab) : null,
          mapel: editMapel.trim() || "Umum",
          target: editTarget.trim() || "Umum",
          thumbnailUrl: finalThumbnailUrl,
          isbn: editIsbn,
          deskripsi: editDeskripsi,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Perubahan konten gagal disimpan.");
      }

      setData((current) => ({
        ...current,
        contents: current.contents.map((c) =>
          c.id === editingContent.id
            ? {
                ...c,
                judul: editTitle.trim(),
                kategori: editCategory,
                bab: editBab ? Number(editBab) : undefined,
                mapel: editMapel.trim() || "Umum",
                target: editTarget.trim() || "Umum",
                thumbnailUrl: finalThumbnailUrl,
                isbn: editIsbn,
                deskripsi: editDeskripsi,
              }
            : c,
        ),
      }));
      setEditingContent(null);
    } catch (e: any) {
      window.alert(e.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page title="Play Konten" hideHeader>
      {!isMobile && (
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <MetricCard
            icon="📚"
            color="#3b82f6"
            title="Total Konten"
            value={String(stats.total)}
            subtitle="Semua format"
          />
          <MetricCard
            icon="🎬"
            color="#f59e0b"
            title="Video"
            value={String(stats.video)}
            subtitle="Video interaktif"
          />
          <MetricCard
            icon="🎮"
            color="#10b981"
            title="Games"
            value={String(stats.games)}
            subtitle="Games HTML5"
          />
          <MetricCard
            icon="📄"
            color="#8b5cf6"
            title="Infografis & Teks"
            value={String(stats.teksInfo)}
            subtitle="Dokumen & gambar"
          />
        </div>
      )}

      {isMobile && (
        <div className="player-mobile-stats">
          <div className="player-stats-total">
            <div>
              <div className="label">Total Konten</div>
              <div className="value">{stats.total}</div>
              <div className="sub">Semua format materi</div>
            </div>
            <div className="icon-box">📚</div>
          </div>
          <div className="player-stats-grid">
            <div className="player-stat-item">
              <div className="icon-wrapper video">🎬</div>
              <h3>{stats.video}</h3>
              <p>Video</p>
            </div>
            <div className="player-stat-item">
              <div className="icon-wrapper games">🎮</div>
              <h3>{stats.games}</h3>
              <p>Games HTML5</p>
            </div>
            <div className="player-stat-item">
              <div className="icon-wrapper docs">📄</div>
              <h3>{stats.teksInfo}</h3>
              <p>Dokumen</p>
            </div>
          </div>
        </div>
      )}

      <div
        className="table-controls play-content-controls"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Cari judul, mapel, atau tingkat..."
        />
        {!isMobile && (
          <>
            <select
              className="input-control"
              value={kelasFilter}
              onChange={(event) => setKelasFilter(event.target.value)}
              style={{ width: 190 }}
              aria-label="Filter tingkatan sekolah"
            >
              <option value="">Semua tingkatan sekolah</option>
              {tingkatOptions.map((tingkat) => (
                <option key={tingkat} value={tingkat}>
                  {tingkat}
                </option>
              ))}
            </select>
            <select
              className="input-control"
              value={mapelFilter}
              onChange={(event) => setMapelFilter(event.target.value)}
              style={{ width: 190 }}
              aria-label="Filter mapel"
            >
              <option value="">Semua mapel</option>
              {mapelOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              className="input-control"
              value={kategoriFilter}
              onChange={(event) => setKategoriFilter(event.target.value)}
              style={{ width: 190 }}
              aria-label="Filter jenis konten"
            >
              <option value="">Semua jenis konten</option>
              {contentCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {!isMobile && (
        <div className="play-content-table">
          <DataTable
            headers={[
              "Thumbnail",
              "Judul",
              "Kategori",
              "Target",
              "Dilihat",
              "AVD",
              "Aksi",
            ]}
            headerAligns={[
              "center",
              "left",
              "left",
              "left",
              "center",
              "center",
              "center",
            ]}
          >
            {paginatedContents.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary-color)",
                      animation: "pulse 1.5s infinite"
                    }}
                  >
                    <BookOpen size={48} />
                    <div style={{ marginTop: 12, color: "var(--text-secondary)", animation: "none" }}>
                      Membuka konten...
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedContents.map((content) => (
                <tr key={content.id}>
                  <td>
                    <ContentThumbnail
                      content={content}
                      onPlay={() => {
                        setSelectedContentId(content.id);
                        setPlayingContent(content);
                      }}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {content.judul}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}
                    </div>
                  </td>
                  <td>
                    <Chip
                      type={content.status === "Terbit" ? "success" : "warning"}
                      label={content.kategori}
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem" }}>
                      {content.target}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{content.dilihat ?? 0}</td>
                  <td style={{ textAlign: "center" }}>
                    {content.dilihat ? Math.round((content.totalWatchTime ?? 0) / content.dilihat) : 0} detik
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Edit ${content.judul}`}
                        title="Edit"
                        onClick={() => openEditModal(content)}
                      >
                        <ActionSvg name="edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Putar ${content.judul}`}
                        title="Putar"
                        onClick={() => {
                          setSelectedContentId(content.id);
                          setPlayingContent(content);
                        }}
                        style={{
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          padding: "6px",
                        }}
                      >
                        <ActionSvg name="play" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button danger play-content-delete-action"
                        aria-label={`Hapus ${content.judul}`}
                        title="Hapus"
                        onClick={async () => {
                          const response = await fetch(
                            `/api/contents?id=${encodeURIComponent(content.id)}`,
                            { method: "DELETE" },
                          );
                          if (!response.ok) {
                            const payload = await response
                              .json()
                              .catch(() => ({}));
                            window.alert(
                              payload.error ?? "Konten gagal dihapus dari D1.",
                            );
                            return;
                          }
                          await setData((current) => {
                            const nextContents = current.contents.filter(
                              (item) => item.id !== content.id,
                            );
                            if (selectedContentId === content.id) {
                              setSelectedContentId("");
                            }
                            return {
                              ...current,
                              contents: nextContents,
                            };
                          });
                        }}
                      >
                        <ActionSvg name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {isMobile && (
        <div className="player-mobile-list" style={{ marginBottom: 16 }}>
          {paginatedContents.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--primary-color)",
                animation: "pulse 1.5s infinite"
              }}
            >
              <BookOpen size={48} />
              <div style={{ marginTop: 12, color: "var(--text-secondary)", animation: "none" }}>
                Membuka konten...
              </div>
            </div>
          ) : (
            paginatedContents.map((content) => {
              const thumbSrc = thumbnailForContent(content);
              const isAutoVideo =
                content.kategori === "Video" &&
                !content.thumbnailUrl &&
                content.sourceUrl;
              return (
                <div key={content.id} className="player-content-card">
                  <div className="card-header">
                    <div className="card-title">{content.judul}</div>
                    <div className="card-subtitle">{content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}</div>
                  </div>
                  <div
                    className="card-thumbnail"
                    onClick={() => {
                      setSelectedContentId(content.id);
                      setPlayingContent(content);
                    }}
                  >
                    <img
                      src={thumbSrc}
                      alt={content.judul}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {isAutoVideo && !isStandalonePwa && (
                      <video
                        src={`${content.sourceUrl}#t=2`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          zIndex: 1,
                        }}
                        preload="auto"
                        muted
                        playsInline
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="card-badge">{content.kategori}</div>
                    <div className="play-button">
                      <ActionSvg name="play" />
                    </div>
                  </div>
                  <div
                    className="card-actions-row"
                  >
                    <span className="card-view-count">
                      <Eye size={14} aria-hidden="true" />
                      <span>{formatNumber(content.dilihat ?? 0)}</span>
                    </span>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="card-action-btn edit"
                        aria-label={`Edit ${content.judul}`}
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(content);
                        }}
                      >
                        <ActionSvg name="edit" />
                      </button>
                      <button
                        type="button"
                        className="card-action-btn play"
                        aria-label={`Putar ${content.judul}`}
                        title="Putar"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContentId(content.id);
                          setPlayingContent(content);
                        }}
                      >
                        <ActionSvg name="play" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {playingContent && (
        <div
          className="content-modal-backdrop play-content-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Putar ${playingContent.judul}`}
          onClick={() => setPlayingContent(null)}
        >
          <div
            className="content-modal play-content-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="content-modal-header">
              <div>
                <span className="preview-kicker">Player Konten</span>
                <h2>{playingContent.judul}</h2>
              </div>
              <button
                type="button"
                className="icon-action-button"
                onClick={() => setPlayingContent(null)}
                aria-label="Tutup player"
              >
                &times;
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <ContentPlayerStage content={playingContent} />
              <RelatedContents
                currentContent={playingContent}
                allContents={data.contents}
                onPlay={setPlayingContent}
              />
            </div>
          </div>
        </div>
      )}

      {editingContent && (
        <div
          className="content-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${editingContent.judul}`}
          onClick={() => setEditingContent(null)}
        >
          <form
            className="content-modal edit-content-modal"
            onSubmit={saveEdit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="content-modal-header">
              <div>
                <span className="preview-kicker">Edit Konten</span>
                <h2>Perbarui metadata</h2>
              </div>
              <button
                type="button"
                className="icon-action-button"
                onClick={() => setEditingContent(null)}
                aria-label="Tutup edit"
              >
                &times;
              </button>
            </div>
            <div className="form-stack">
              <label>
                Judul Konten
                <input
                  className="input-control"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  required
                  disabled={isSaving}
                />
              </label>
              <label>
                Kategori
                <select
                  className="input-control"
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(event.target.value as ContentCategory)
                  }
                  disabled={isSaving}
                >
                  {contentCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bab
                <select
                  className="input-control"
                  value={editBab}
                  onChange={(event) => setEditBab(event.target.value)}
                  disabled={isSaving}
                >
                  <option value="">Tanpa Bab</option>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((item) => (
                    <option key={item} value={item}>Bab {item}</option>
                  ))}
                </select>
              </label>
              <label>
                Kelas
                <select
                  className="input-control"
                  value={editSelectedKelas}
                  onChange={(e) => {
                    setEditSelectedKelas(e.target.value);
                    setEditIsbn("");
                    setEditMapel("");
                    setEditTarget("");
                  }}
                  disabled={isSaving}
                >
                  <option value="">Semua Kelas</option>
                  {editAvailableKelas.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Buku Induk
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  options={masterBooks
                    .filter(
                      (b) =>
                        !editSelectedKelas || b.kelas === editSelectedKelas,
                    )
                    .map((b) => ({
                      value: b.isbn,
                      label: `${b.judul} (${b.mapel} - ${b.jenjang || b.peruntukan || "-"})`,
                    }))}
                  value={
                    editIsbn
                      ? {
                          value: editIsbn,
                          label: masterBooks.find((b) => b.isbn === editIsbn)
                            ? `${masterBooks.find((b) => b.isbn === editIsbn)?.judul} (${masterBooks.find((b) => b.isbn === editIsbn)?.mapel} - ${masterBooks.find((b) => b.isbn === editIsbn)?.jenjang || masterBooks.find((b) => b.isbn === editIsbn)?.peruntukan || "-"})`
                            : editIsbn,
                        }
                      : null
                  }
                  onChange={(sel) => {
                    const val = sel?.value || "";
                    setEditIsbn(val);
                    const book = masterBooks.find((b) => b.isbn === val);
                    if (book) {
                      setEditMapel(book.mapel);
                      setEditTarget(book.jenjang || book.peruntukan || "-");
                    } else {
                      setEditMapel("");
                      setEditTarget("");
                    }
                  }}
                  placeholder="Pilih buku induk..."
                  isClearable
                  isDisabled={isSaving}
                />
              </label>

              <label>
                Deskripsi Konten
                <textarea
                  className="input-control"
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  placeholder="Jelaskan isi, tujuan pembelajaran, dan materi yang dibahas..."
                  rows={4}
                  disabled={isSaving}
                />
              </label>

              <div className="file-upload-group" style={{ marginTop: 12 }}>
                <div className="upload-label">
                  Ganti Thumbnail
                  <span className="upload-subtitle">(Opsional. Max 2MB)</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  {editThumbnailPreview && (
                    <img
                      src={editThumbnailPreview}
                      alt="Preview"
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  )}
                  <label className="file-input-wrapper">
                    <span className="action-button">Pilih Thumbnail Baru</span>
                    <input
                      type="file"
                      style={{ display: "none" }}
                      accept=".png,.jpg,.jpeg,.webp"
                      disabled={isSaving}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditThumbnailFile(file);
                          setEditThumbnailPreview(await fileToDataUrl(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="button-row upload-actions">
              <ButtonPromax type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </ButtonPromax>
              <button
                type="button"
                className="action-button"
                onClick={() => setEditingContent(null)}
                disabled={isSaving}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </Page>
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
            className="icon-action-button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function Subscriptions() {
  const { session } = useAuth();
  const { data, setData } = useAppData();
  const [selectedInvoice, setSelectedInvoice] = useState<{
    invoiceNo: string;
    status: string;
    mulai: string;
    selesai: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const stats = useMemo(
    () => ({
      total: data.subscriptions.length,
      pending: data.subscriptions.filter(
        (item) => item.status === "Menunggu Approve Agen",
      ).length,
      approved: data.subscriptions.filter(
        (item) =>
          item.status === "Disetujui Agen" ||
          item.status === "Disetujui Super Admin" ||
          item.status === "Aktif",
      ).length,
      overdue: data.subscriptions.filter((item) =>
        canSuperAdminApproveSubscription(item),
      ).length,
    }),
    [data.subscriptions],
  );

  const approveAsAgent = (subscriptionId: string) => {
    setData((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((item) =>
        item.id === subscriptionId
          ? {
              ...item,
              status: "Disetujui Agen",
              approverRole: "agen",
              approverName: session?.displayName ?? "Agen",
              agentApprovedAt: new Date().toISOString().slice(0, 10),
            }
          : item,
      ),
    }));
  };

  const approveAsSuperAdmin = (subscriptionId: string) => {
    setData((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((item) =>
        item.id === subscriptionId
          ? {
              ...item,
              status: "Disetujui Super Admin",
              approverRole: "superadmin",
              approverName: session?.displayName ?? "Super Admin",
              superAdminApprovedAt: new Date().toISOString().slice(0, 10),
            }
          : item,
      ),
    }));
  };

  const visibleRole = session?.role ?? "superadmin";

  const filteredSubscriptions = useMemo(() => {
    return data.subscriptions.filter((sub) => {
      const school = getSchool(data, sub.schoolId);
      const s = search.toLowerCase();
      return (
        sub.invoiceNo.toLowerCase().includes(s) ||
        (school?.nama || "").toLowerCase().includes(s) ||
        sub.paket.toLowerCase().includes(s) ||
        sub.status.toLowerCase().includes(s)
      );
    });
  }, [data.subscriptions, data, search]);

  const totalPages =
    Math.ceil(filteredSubscriptions.length / itemsPerPage) || 1;
  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSubscriptions.slice(start, start + itemsPerPage);
  }, [filteredSubscriptions, page]);

  return (
    <Page
      title="Langganan Sekolah"
      subtitle="Kelola paket subscribe 3 bulan, 6 bulan, dan 1 tahun dengan alur approve oleh agen lalu super admin sebagai fallback."
    >
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <MetricCard
          icon="💼"
          color="#3b82f6"
          title="Total Langganan"
          value={String(stats.total)}
          subtitle="Semua request"
        />
        <MetricCard
          icon="⏳"
          color="#f59e0b"
          title="Menunggu"
          value={String(stats.pending)}
          subtitle="Butuh approve agen"
        />
        <MetricCard
          icon="✅"
          color="#10b981"
          title="Disetujui"
          value={String(stats.approved)}
          subtitle="Siap aktif"
        />
        <MetricCard
          icon="⛔"
          color="#ef4444"
          title="Lewat 3 Hari"
          value={String(stats.overdue)}
          subtitle="Bisa di-override super admin"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <TableSearch
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Cari invoice, sekolah, paket..."
        />
      </div>

      <DataTable
        headers={[
          "Invoice",
          "Sekolah",
          "Paket",
          "Durasi",
          "Nominal",
          "Deadline Agen",
          "Status",
          "Aksi",
        ]}
        headerAligns={[
          "left",
          "left",
          "left",
          "center",
          "right",
          "center",
          "center",
          "center",
        ]}
      >
        {paginatedSubscriptions.map((subscription) => {
          const school = getSchool(data, subscription.schoolId);
          const canAgentApprove =
            visibleRole === "agen" &&
            subscription.status === "Menunggu Approve Agen";
          const canOverride =
            visibleRole === "superadmin" &&
            canSuperAdminApproveSubscription(subscription);
          return (
            <tr key={subscription.id}>
              <td>{subscription.invoiceNo}</td>
              <td>
                <div>{school?.nama ?? "-"}</div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.78rem",
                  }}
                >
                  {school?.kota ?? "-"}
                </div>
              </td>
              <td>{subscription.paket}</td>
              <td>{subscription.durasi}</td>
              <td style={{ color: "var(--success)", fontWeight: 700 }}>
                {formatCurrency(subscription.nominal)}
              </td>
              <td>{subscription.agentDeadline}</td>
              <td>
                <Chip
                  type={
                    subscription.status.includes("Menunggu")
                      ? "warning"
                      : "success"
                  }
                  label={subscription.status}
                />
              </td>
              <td>
                <div className="action-group">
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Lihat"
                    aria-label={`Lihat ${subscription.invoiceNo}`}
                    onClick={() =>
                      setSelectedInvoice({
                        invoiceNo: subscription.invoiceNo,
                        status: subscription.status,
                        mulai: subscription.mulai,
                        selesai: subscription.selesai,
                      })
                    }
                  >
                    <ActionSvg name="view" />
                  </button>
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Approve Agen"
                    aria-label={`Approve agen ${subscription.invoiceNo}`}
                    disabled={!canAgentApprove}
                    onClick={() => approveAsAgent(subscription.id)}
                  >
                    <ActionSvg name="check" />
                  </button>
                  <button
                    type="button"
                    className="icon-action-button danger"
                    title="Approve Super Admin"
                    aria-label={`Approve super admin ${subscription.invoiceNo}`}
                    disabled={!canOverride}
                    onClick={() => approveAsSuperAdmin(subscription.id)}
                  >
                    <ActionSvg name="check" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <div style={{ marginTop: 16 }}>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <InfoModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice ${selectedInvoice?.invoiceNo}`}
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <strong>Status:</strong> {selectedInvoice?.status}
            </div>
            <div>
              <strong>Tanggal Mulai:</strong> {selectedInvoice?.mulai}
            </div>
            <div>
              <strong>Tanggal Selesai:</strong> {selectedInvoice?.selesai}
            </div>
          </div>
        }
      />
    </Page>
  );
}

export function Payments() {
  const { data, setData } = useAppData();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const markPaid = (id: string) => {
    setData((current) => ({
      ...current,
      payments: current.payments.map((payment) =>
        payment.id === id ? { ...payment, status: "Lunas" } : payment,
      ),
    }));
  };

  const filteredPayments = useMemo(() => {
    return data.payments.filter((payment) => {
      const school = getSchool(data, payment.schoolId);
      const s = search.toLowerCase();
      return (
        payment.id.toLowerCase().includes(s) ||
        (payment.invoiceNo || "").toLowerCase().includes(s) ||
        (school?.nama || "").toLowerCase().includes(s) ||
        payment.status.toLowerCase().includes(s)
      );
    });
  }, [data.payments, data, search]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, page]);

  return (
    <Page
      title="Pembayaran Sekolah"
      subtitle="Pantau tagihan hasil transaksi dan ubah status pembayaran."
    >
      <div style={{ marginBottom: 16 }}>
        <TableSearch
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Cari invoice, sekolah..."
        />
      </div>

      <DataTable
        headers={[
          "ID",
          "Invoice",
          "Sekolah",
          "Nominal",
          "Jatuh Tempo",
          "Status",
          "Aksi",
        ]}
        headerAligns={[
          "left",
          "left",
          "left",
          "right",
          "center",
          "center",
          "center",
        ]}
      >
        {paginatedPayments.map((payment) => {
          const school = getSchool(data, payment.schoolId);
          return (
            <tr key={payment.id}>
              <td>{payment.id}</td>
              <td>{payment.invoiceNo ?? "-"}</td>
              <td>{school?.nama ?? "-"}</td>
              <td style={{ color: "var(--success)", fontWeight: 700 }}>
                {formatCurrency(payment.nominal)}
              </td>
              <td>
                {new Date(payment.jatuhTempo).toLocaleDateString("id-ID")}
              </td>
              <td>
                <Chip
                  type={payment.status === "Lunas" ? "success" : "warning"}
                  label={payment.status}
                />
              </td>
              <td>
                <div className="action-group">
                  <button
                    className="action-button success"
                    onClick={() => markPaid(payment.id)}
                    disabled={payment.status === "Lunas"}
                  >
                    Tandai Lunas
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <div style={{ marginTop: 16 }}>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </Page>
  );
}

export function SchoolUsers() {
  const { data } = useAppData();
  const { session } = useAuth();
  const [apiUsers, setApiUsers] = useState<any[]>([]);
  const [apiBooks, setApiBooks] = useState<any[]>([]);
  const currentUser = useMemo(
    () => apiUsers.find((u) => u.username === session?.username),
    [apiUsers, session],
  );
  const sessionSchoolId = session?.sekolahId || currentUser?.sekolah_id;
  const sessionWilayah =
    (session as any)?.wilayah || currentUser?.wilayah || "";
  const currentSchool = sessionSchoolId
    ? getSchool(data, sessionSchoolId)
    : data.schools?.find(
        (s: any) => s.nama?.toLowerCase() === sessionWilayah?.toLowerCase(),
      );
  const schoolId = sessionSchoolId || currentSchool?.id || 1;

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          setApiUsers(json.data);
        }
      })
      .catch(console.error);

    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          setApiBooks(json.data);
        }
      })
      .catch(console.error);
  }, []);

  const schoolStaff = useMemo(() => {
    const allUsers = apiUsers.length > 0 ? apiUsers : data.users;
    const realUsers = allUsers.filter((u: any) => {
      if (u.sekolah_id === schoolId || u.sekolahId === schoolId) return true;
      if (
        currentSchool &&
        u.wilayah?.toLowerCase() === currentSchool.nama?.toLowerCase()
      )
        return true;
      if (
        sessionWilayah &&
        u.wilayah?.toLowerCase() === sessionWilayah.toLowerCase()
      )
        return true;
      return false;
    });

    return realUsers
      .filter(
        (u: any) =>
          u.role === "guru" || u.role === "siswa" || u.role === "sekolah",
      )
      .map((u: any) => ({
        id: u.id,
        schoolId,
        username: u.username,
        nama: u.nama,
        role: (u.role === "sekolah" ? "admin" : u.role) as any,
        mapel:
          u.role === "siswa"
            ? u.kelas || "Siswa"
            : u.role === "sekolah" || u.role === "admin"
              ? u.kelas || "Operator"
              : u.kelas || "Guru Mapel",
        status: (u.status as any) || "Aktif",
        initial:
          u.initial ||
          (u.nama || u.username || "").substring(0, 2).toUpperCase(),
        color: u.color || "#64748b",
        terakhirLogin: u.terakhir_login || u.terakhirLogin || "Belum login",
        ssoEnabled: !!u.sso_id || !!u.ssoId,
      }));
  }, [data.users, apiUsers, schoolId, currentSchool, sessionWilayah]);

  const mapelOptions = useMemo(() => {
    let allBooks = apiBooks.length > 0 ? apiBooks : data.books;

    const userSchoolLevel = currentSchool
      ? getSchoolLevel(currentSchool.nama)
      : getSchoolLevel(sessionWilayah);
    if (userSchoolLevel) {
      const sl = userSchoolLevel.toLowerCase();
      allBooks = allBooks.filter((b) => {
        const p = (b.jenjang || b.peruntukan || "").toLowerCase();
        if (p === "umum" || p.includes("semua") || p === "") return true;
        if (sl === "sd/mi" && !p.includes("sd") && !p.includes("mi"))
          return false;
        if (sl === "smp/mts" && !p.includes("smp") && !p.includes("mts"))
          return false;
        if (
          sl === "sma/ma/smk" &&
          !p.includes("sma") &&
          !p.includes("smk") &&
          !p.includes("ma")
        )
          return false;
        return true;
      });
    }

    // ensure unique by title
    const uniqueBooks = Array.from(
      new Map(allBooks.map((b: any) => [b.judul, b])).values(),
    );

    return uniqueBooks
      .sort((a: any, b: any) => (a.judul || "").localeCompare(b.judul || ""))
      .map((b: any) => {
        const peruntukan = b.jenjang || b.peruntukan || "-";
        const kelas = b.kelas || "-";
        const isbn = b.isbn || "-";
        const mapelText = b.mapel || "-";
        const judul = b.judul || "-";
        return {
          value: judul,
          label: `${judul} (ISBN: ${isbn} | Mapel: ${mapelText} | Peruntukan: ${peruntukan} | Kelas: ${kelas})`,
        };
      });
  }, [data.books, apiBooks, currentSchool, sessionWilayah]);
  const kelasOptions = useMemo(
    () => [
      "PAUD/TK",
      "SD Kelas I",
      "SD Kelas II",
      "SD Kelas III",
      "SD Kelas IV",
      "SD Kelas V",
      "SD Kelas VI",
      "SMP Kelas VII",
      "SMP Kelas VIII",
      "SMP Kelas IX",
      "SMA Kelas X",
      "SMA Kelas XI",
      "SMA Kelas XII",
      "SMK Kelas X",
      "SMK Kelas XI",
      "SMK Kelas XII",
    ],
    [],
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<SimSchoolUser["role"]>("guru");
  const [mapel, setMapel] = useState("");
  const [status, setStatus] = useState<SimSchoolUser["status"]>("Aktif");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const clearStaffForm = () => {
    setEditingStaffId(null);
    setNama("");
    setUsername("");
    setRole("guru");
    setMapel("");
    setStatus("Aktif");
    setPassword("");
  };

  const openCreateStaffModal = () => {
    clearStaffForm();
    setStaffModalOpen(true);
  };

  const editStaff = (staff: SimSchoolUser) => {
    setEditingStaffId(staff.id);
    setNama(staff.nama);
    setUsername(staff.username);
    setRole(staff.role);
    setMapel(staff.mapel);
    setStatus(staff.status);
    setPassword(staff.password || "");
    setStaffModalOpen(true);
  };

  const saveStaff = async (event: FormEvent) => {
    event.preventDefault();
    if (!nama.trim() || !username.trim()) return;
    if (role !== "admin" && !mapel.trim()) {
      setMessage("Silakan lengkapi mapel/kelas.");
      return;
    }

    try {
      const mappedRole = role === "admin" ? "sekolah" : role;
      const payload = {
        username,
        password: password || undefined,
        nama,
        role: mappedRole,
        wilayah: currentSchool?.nama || sessionWilayah || "",
        sekolah_id: schoolId,
        newUserSource: null,
        status,
        kelas: role === "admin" ? "Operator" : mapel,
      };

      let resPayload;
      if (editingStaffId && !editingStaffId.startsWith("SCH-")) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}`}/api/users/${editingStaffId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        resPayload = await res.json().catch(() => ({}));
        if (!res.ok || resPayload.error)
          throw new Error(resPayload.error || "Gagal mengupdate user");
      } else {
        const apiUrl = import.meta.env.DEV
          ? ""
          : import.meta.env.VITE_API_URL ||
            "https://sales-api.1912.workers.dev";
        const res = await fetch(`${apiUrl}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        resPayload = await res.json().catch(() => ({}));
        if (!res.ok || resPayload.error)
          throw new Error(resPayload.error || "Gagal menambahkan user");
      }

      // Re-fetch users to update the list
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json.success && json.data) {
          setApiUsers(json.data);
        }
      }

      // We removed the optimistic UI update to `data.schoolUsers` here because we already re-fetched `apiUsers` directly above.
      // Relying solely on `apiUsers` prevents ghost users from persisting across DB deletions.

      setMessage(
        editingStaffId
          ? "User sekolah diperbarui."
          : "User sekolah ditambahkan.",
      );
      clearStaffForm();
      setStaffModalOpen(false);
    } catch (e) {
      console.error(e);
      setMessage(e instanceof Error ? e.message : "Gagal menyimpan user.");
    }
  };

  const deleteStaff = async (staffId: string) => {
    try {
      if (!staffId.startsWith("SCH-")) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}`}/api/users/${staffId}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          window.alert(payload.error || "Gagal menghapus user");
          return;
        }
        const getRes = await fetch(
          `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
          { cache: "no-store" },
        );
        if (getRes.ok) {
          const json = (await getRes.json()) as any;
          if (json.success && json.data) setApiUsers(json.data);
        }
      }
      // Removed redundant local mock state filter
    } catch (e) {
      window.alert("Gagal menghapus user");
    }
  };

  const staffStats = useMemo(
    () => ({
      total: schoolStaff.length,
      admins: schoolStaff.filter((item) => item.role === "admin").length,
      gurus: schoolStaff.filter((item) => item.role === "guru").length,
      siswas: schoolStaff.filter((item) => item.role === "siswa").length,
    }),
    [schoolStaff],
  );

  const filteredStaff = useMemo(() => {
    return schoolStaff.filter((staff) => {
      const s = search.toLowerCase();
      return (
        staff.nama.toLowerCase().includes(s) ||
        staff.username.toLowerCase().includes(s) ||
        staff.mapel.toLowerCase().includes(s) ||
        staff.role.toLowerCase().includes(s)
      );
    });
  }, [schoolStaff, search]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, page]);

  return (
    <Page
      title="Users Sekolah"
      subtitle={`Kelola user sekolah untuk ${currentSchool?.nama || sessionWilayah || "sekolah"}.`}
    >
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <MetricCard
          icon="🏫"
          color="#3b82f6"
          title="Total User"
          value={String(staffStats.total)}
          subtitle="Admin, guru, dan siswa aktif"
        />
        <MetricCard
          icon="🛡️"
          color="#10b981"
          title="Admin Sekolah"
          value={String(staffStats.admins)}
          subtitle="Pemberi hak akses"
        />
        <MetricCard
          icon="👩‍🏫"
          color="#8b5cf6"
          title="Guru"
          value={String(staffStats.gurus)}
          subtitle="Pengguna konten mapel"
        />
        <MetricCard
          icon="🎓"
          color="#f59e0b"
          title="Siswa"
          value={String(staffStats.siswas)}
          subtitle="Peserta didik"
        />
      </div>

      <div
        className="page-action-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, marginRight: 16 }}>
          <TableSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Cari staff, username, atau role..."
          />
        </div>
        <ButtonPromax type="button" onClick={openCreateStaffModal}>
          + Add User
        </ButtonPromax>
      </div>

      <DataTable
        headers={[
          "User",
          "Username",
          "Role",
          "Mapel / Posisi",
          "Status",
          "Aksi",
        ]}
        headerAligns={["left", "left", "left", "left", "center", "center"]}
      >
        {paginatedStaff.map((staff) => (
          <tr key={staff.id}>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="user-avatar"
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: "0.78rem",
                    background: staff.color,
                  }}
                >
                  {staff.initial}
                </div>
                <div>
                  <div>{staff.nama}</div>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.78rem",
                    }}
                  >
                    {staff.terakhirLogin}
                  </div>
                </div>
              </div>
            </td>
            <td style={{ color: "var(--text-secondary)" }}>
              <div>{staff.username}</div>
              {staff.ssoEnabled && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                    fontSize: "0.65rem",
                    background: "#ecfdf5",
                    color: "#059669",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  SSO Aktif
                </div>
              )}
            </td>
            <td>
              <Chip
                type={
                  staff.role === "admin"
                    ? "success"
                    : staff.role === "guru"
                      ? "warning"
                      : "info"
                }
                label={
                  staff.role === "admin"
                    ? "Admin Sekolah"
                    : staff.role === "guru"
                      ? "Guru"
                      : "Siswa"
                }
              />
            </td>
            <td>{staff.mapel}</td>
            <td>
              <Chip
                type={staff.status === "Aktif" ? "success" : "warning"}
                label={staff.status}
              />
            </td>
            <td>
              <div className="action-group">
                <button
                  type="button"
                  className="icon-action-button"
                  title="Lihat"
                  aria-label={`Lihat ${staff.nama}`}
                  onClick={() => editStaff(staff)}
                >
                  <ActionSvg name="view" />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  title="Edit"
                  aria-label={`Edit ${staff.nama}`}
                  onClick={() => editStaff(staff)}
                >
                  <ActionSvg name="edit" />
                </button>
                <button
                  type="button"
                  className="icon-action-button danger"
                  title="Hapus"
                  aria-label={`Hapus ${staff.nama}`}
                  onClick={() => deleteStaff(staff.id)}
                >
                  <ActionSvg name="delete" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <div style={{ marginTop: 16 }}>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {isStaffModalOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => {
            setStaffModalOpen(false);
            clearStaffForm();
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingStaffId ? "Edit User Sekolah" : "Tambah User Sekolah"}
              </h3>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setStaffModalOpen(false);
                  clearStaffForm();
                }}
              >
                &times;
              </button>
            </div>
            {message && (
              <div
                className={`status-message ${message.toLowerCase().includes("berhasil") || message.toLowerCase().includes("ditambahkan") || message.toLowerCase().includes("diperbarui") ? "success" : "error"}`}
                style={{ margin: "16px 24px 0 24px" }}
              >
                {message}
              </div>
            )}
            <form onSubmit={saveStaff}>
              <div className="modal-body">
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "20px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Tambah admin, guru, atau siswa ke sekolah Anda.
                </p>
                <div
                  className="form-grid"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <label>
                    Nama
                    <input
                      className="input-control"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama lengkap"
                      required
                    />
                  </label>
                  <label>
                    Username
                    <input
                      className="input-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      required
                    />
                  </label>
                  <label>
                    Password{" "}
                    {editingStaffId && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "normal",
                          color: "var(--text-secondary)",
                        }}
                      >
                        (Kosongkan jika tidak diubah)
                      </span>
                    )}
                    <input
                      className="input-control"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password login"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      className="input-control"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as SimSchoolUser["role"])
                      }
                    >
                      <option value="guru">Guru</option>
                      <option value="admin">Admin Sekolah</option>
                      <option value="siswa">Siswa</option>
                    </select>
                  </label>
                  <label>
                    {role === "admin"
                      ? "Posisi"
                      : role === "siswa"
                        ? "Kelas"
                        : "Mata Pelajaran (Mapel)"}
                    {role === "admin" ? (
                      <input
                        className="input-control"
                        value="Operator"
                        disabled
                      />
                    ) : role === "siswa" ? (
                      <select
                        className="input-control"
                        value={mapel}
                        onChange={(e) => setMapel(e.target.value)}
                        required
                      >
                        <option value="">Pilih Kelas</option>
                        {kelasOptions.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ position: "relative", zIndex: 50 }}>
                        <Select
                          options={mapelOptions}
                          value={
                            mapelOptions.find((o: any) => o.value === mapel) ||
                            (mapel ? { value: mapel, label: mapel } : null)
                          }
                          onChange={(option: any) =>
                            setMapel(option?.value || "")
                          }
                          placeholder="Cari Master Katalog..."
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "44px",
                              borderRadius: "10px",
                              borderColor: "var(--border-subtle)",
                              background: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                            }),
                            menu: (base) => ({ ...base, zIndex: 9999 }),
                            singleValue: (base) => ({
                              ...base,
                              color: "var(--text-primary)",
                            }),
                            input: (base) => ({
                              ...base,
                              color: "var(--text-primary)",
                            }),
                          }}
                        />
                      </div>
                    )}
                  </label>
                  <label>
                    Status
                    <select
                      className="input-control"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as SimSchoolUser["status"])
                      }
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </label>
                </div>
              </div>
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="button-promax"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                  onClick={() => {
                    setStaffModalOpen(false);
                    clearStaffForm();
                  }}
                >
                  Batal
                </button>
                <ButtonPromax type="submit">
                  {editingStaffId ? "Simpan Perubahan" : "Tambah User"}
                </ButtonPromax>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
}

export function Inventory() {
  const { session } = useAuth();
  const { data, isLoading } = useAppData();
  const schoolId = session?.sekolahId || (session as any)?.sekolah_id || 1;

  const userSchoolLevel = useMemo(() => {
    let level: string | null = null;
    const sessionSchoolId = session?.sekolahId || (session as any)?.sekolah_id;
    if (sessionSchoolId) {
      const userSchool = data.schools.find(
        (s) => s.id === Number(sessionSchoolId),
      );
      if (userSchool) {
        level = getSchoolLevel(userSchool.nama);
      }
    }
    if (!level && (session as any)?.wilayah) {
      level = getSchoolLevel((session as any).wilayah);
    }
    return level;
  }, [data.schools, session]);

  const accessibleContents = useMemo(() => {
    const purchasedIsbns = new Set(
      data.sales
        .filter((item) => item.schoolId === schoolId)
        .map((item) => item.isbn),
    );
    const picked = data.contents.filter(
      (content) => content.isbn && purchasedIsbns.has(content.isbn),
    );
    const contentsToFilter = picked.length ? picked : data.contents;

    if (userSchoolLevel) {
      const schoolLvl = userSchoolLevel.toLowerCase();
      return contentsToFilter.filter((c) => {
        const book = data.books.find((b) => b.isbn === c.isbn);
        const bPeruntukan = (
          book?.jenjang ||
          book?.peruntukan ||
          c.target ||
          ""
        ).toLowerCase();

        if (
          bPeruntukan === "umum" ||
          bPeruntukan.includes("semua") ||
          bPeruntukan === ""
        )
          return true;
        if (
          schoolLvl === "sd/mi" &&
          !bPeruntukan.includes("sd") &&
          !bPeruntukan.includes("mi")
        )
          return false;
        if (
          schoolLvl === "smp/mts" &&
          !bPeruntukan.includes("smp") &&
          !bPeruntukan.includes("mts")
        )
          return false;
        if (
          schoolLvl === "sma/ma/smk" &&
          !bPeruntukan.includes("sma") &&
          !bPeruntukan.includes("smk") &&
          !bPeruntukan.includes("ma")
        )
          return false;

        return true;
      });
    }

    return contentsToFilter;
  }, [data.contents, data.sales, data.books, userSchoolLevel, schoolId]);

  const [playingContent, setPlayingContent] = useState<SimContent | null>(null);
  const [contentPage, setContentPage] = useState(1);
  const itemsPerPage = 25;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        handler as (e: MediaQueryListEvent) => void,
      );
  }, []);

  const [contentSearch, setContentSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  const filteredContents = useMemo(() => {
    return accessibleContents.filter((content) => {
      const s = contentSearch.toLowerCase();
      const matchSearch =
        content.judul.toLowerCase().includes(s) ||
        (content.mapel || "").toLowerCase().includes(s);
      const matchKategori = filterKategori
        ? content.kategori === filterKategori
        : true;
      return matchSearch && matchKategori;
    });
  }, [accessibleContents, contentSearch, filterKategori]);

  const contentTotalPages = Math.max(
    1,
    Math.ceil(filteredContents.length / itemsPerPage),
  );
  const paginatedContents = useMemo(() => {
    const start = (contentPage - 1) * itemsPerPage;
    return filteredContents.slice(start, start + itemsPerPage);
  }, [filteredContents, contentPage]);

  const kategoriOptions = useMemo(
    () =>
      Array.from(
        new Set(accessibleContents.map((c) => c.kategori).filter(Boolean)),
      ),
    [accessibleContents],
  );

  return (
    <Page
      title={`Inventaris KontenMu ${userSchoolLevel ? `(${userSchoolLevel})` : ""}`}
      subtitle="Stok lisensi sekolah dihitung dari penjualan dikurangi alokasi siswa."
      hideHeader
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 250px" }}>
          <TableSearch
            value={contentSearch}
            onChange={(val) => {
              setContentSearch(val);
              setContentPage(1);
            }}
            placeholder="Pencarian cerdas judul atau mapel..."
          />
        </div>
        <select
          className="input-control"
          style={{ width: "auto", minWidth: "200px", flex: "0 0 auto" }}
          value={filterKategori}
          onChange={(e) => {
            setFilterKategori(e.target.value);
            setContentPage(1);
          }}
        >
          <option value="">Semua Jenis Konten</option>
          {kategoriOptions.map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>
      </div>

      {!isMobile && (
        <div className="play-content-table" style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 16 }}>Daftar Konten Tersedia</h4>
          <DataTable
            headers={[
              "Thumbnail",
              "Judul",
              "Kategori",
              "Target",
              "Status",
              "Aksi",
            ]}
            headerAligns={[
              "center",
              "left",
              "left",
              "left",
              "center",
              "center",
            ]}
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "60px 40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      width: "24px",
                      height: "24px",
                      border: "3px solid var(--border-subtle)",
                      borderTopColor: "var(--brand-primary)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginBottom: "12px",
                    }}
                  />
                  <div>Memuat inventaris konten...</div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </td>
              </tr>
            ) : paginatedContents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Tidak ada konten yang tersedia.
                </td>
              </tr>
            ) : (
              paginatedContents.map((content) => (
                <tr key={content.id}>
                  <td>
                    <ContentThumbnail
                      content={content}
                      onPlay={() => setPlayingContent(content)}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {content.judul}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}
                    </div>
                  </td>
                  <td>
                    <Chip
                      type={content.status === "Terbit" ? "success" : "warning"}
                      label={content.kategori}
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem" }}>
                      {content.target}
                    </span>
                  </td>
                  <td>{content.status}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Putar ${content.judul}`}
                        title="Putar"
                        onClick={() => setPlayingContent(content)}
                        style={{
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          padding: "6px",
                        }}
                      >
                        <ActionSvg name="play" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={contentPage}
              totalPages={contentTotalPages}
              onPageChange={setContentPage}
            />
          </div>
        </div>
      )}

      {isMobile && (
        <div className="player-mobile-list" style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 16, fontSize: "1.1rem" }}>
            Daftar Konten Tersedia
          </h4>
          {isLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 40px",
                color: "var(--text-secondary)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "24px",
                  height: "24px",
                  border: "3px solid var(--border-subtle)",
                  borderTopColor: "var(--brand-primary)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "12px",
                }}
              />
              <div>Memuat inventaris konten...</div>
            </div>
          ) : paginatedContents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-secondary)",
              }}
            >
              Tidak ada konten yang tersedia.
            </div>
          ) : (
            paginatedContents.map((content) => {
              const thumbSrc = thumbnailForContent(content);
              const isAutoVideo =
                content.kategori === "Video" &&
                !content.thumbnailUrl &&
                content.sourceUrl;
              return (
                <div key={content.id} className="player-content-card">
                  <div className="card-header">
                    <div className="card-title">{content.judul}</div>
                    <div className="card-subtitle">{content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}</div>
                  </div>
                  <div
                    className="card-thumbnail"
                    onClick={() => setPlayingContent(content)}
                  >
                    <img
                      src={thumbSrc}
                      alt={content.judul}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {isAutoVideo && (
                      <video
                        src={`${content.sourceUrl}#t=2`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          zIndex: 1,
                        }}
                        preload="auto"
                        muted
                        playsInline
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="card-badge">{content.kategori}</div>
                    <div className="play-button">
                      <ActionSvg name="play" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={contentPage}
              totalPages={contentTotalPages}
              onPageChange={setContentPage}
            />
          </div>
        </div>
      )}

      {playingContent && (
        <div
          className="content-modal-backdrop play-content-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Putar ${playingContent.judul}`}
          onClick={() => setPlayingContent(null)}
        >
          <div
            className="content-modal play-content-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="content-modal-header">
              <div>
                <span className="preview-kicker">Player Konten</span>
                <h2>{playingContent.judul}</h2>
              </div>
              <button
                type="button"
                className="icon-action-button"
                onClick={() => setPlayingContent(null)}
                aria-label="Tutup player"
              >
                &times;
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <ContentPlayerStage content={playingContent} />
              <RelatedContents
                currentContent={playingContent}
                allContents={data.contents}
                onPlay={setPlayingContent}
              />
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export function Allocation() {
  const { session } = useAuth();
  const { data, setData } = useAppData();
  const [users, setUsers] = useState<any[]>([]);

  const currentUser = useMemo(
    () => users.find((u) => u.username === session?.username),
    [users, session],
  );
  const sessionSchoolId = session?.sekolahId || currentUser?.sekolah_id;
  const sessionWilayah =
    (session as any)?.wilayah || currentUser?.wilayah || "";
  const currentSchool = sessionSchoolId
    ? data.schools?.find((s: any) => s.id === sessionSchoolId)
    : data.schools?.find(
        (s: any) => s.nama?.toLowerCase() === sessionWilayah?.toLowerCase(),
      );
  const schoolId = sessionSchoolId || currentSchool?.id || 1;

  const students = useMemo(() => {
    return users.filter((u: any) => {
      const matchSchool =
        u.sekolah_id === schoolId ||
        u.sekolahId === schoolId ||
        (currentSchool &&
          u.wilayah?.toLowerCase() === currentSchool.nama?.toLowerCase()) ||
        (sessionWilayah &&
          u.wilayah?.toLowerCase() === sessionWilayah.toLowerCase());
      return matchSchool && u.role === "siswa";
    });
  }, [users, schoolId, currentSchool, sessionWilayah]);
  const [studentUsername, setStudentUsername] = useState("");

  const [isbn, setIsbn] = useState("");
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [masterBooks, setMasterBooks] = useState<any[]>([]);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setUsers(res.data);
          const stds = res.data.filter((u: any) => u.role === "siswa");
          if (stds.length > 0) setStudentUsername(stds[0].username);
        }
      })
      .catch(console.error);
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setMasterBooks(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMapel, setSelectedMapel] = useState("");
  const itemsPerPage = 25;

  const uniqueMapels = useMemo(() => {
    let result = Array.from(
      new Map(masterBooks.map((b) => [b.isbn || b.judul, b])).values(),
    );
    const userSchoolLevel = currentSchool
      ? getSchoolLevel(currentSchool.nama)
      : getSchoolLevel(sessionWilayah);
    if (userSchoolLevel) {
      const sl = userSchoolLevel.toLowerCase();
      result = result.filter((b) => {
        const p = (b.jenjang || b.peruntukan || "").toLowerCase();
        if (p === "umum" || p.includes("semua") || p === "") return true;
        if (sl === "sd/mi" && !p.includes("sd") && !p.includes("mi"))
          return false;
        if (sl === "smp/mts" && !p.includes("smp") && !p.includes("mts"))
          return false;
        if (
          sl === "sma/ma/smk" &&
          !p.includes("sma") &&
          !p.includes("smk") &&
          !p.includes("ma")
        )
          return false;
        return true;
      });
    }
    const mapels = result.map((b) => b.mapel).filter(Boolean);
    return Array.from(new Set(mapels)).sort();
  }, [masterBooks, currentSchool, sessionWilayah]);

  const filteredBooks = useMemo(() => {
    let result = Array.from(
      new Map(masterBooks.map((b) => [b.isbn || b.judul, b])).values(),
    );
    const userSchoolLevel = currentSchool
      ? getSchoolLevel(currentSchool.nama)
      : getSchoolLevel(sessionWilayah);
    if (userSchoolLevel) {
      const sl = userSchoolLevel.toLowerCase();
      result = result.filter((b) => {
        const p = (b.jenjang || b.peruntukan || "").toLowerCase();
        if (p === "umum" || p.includes("semua") || p === "") return true;
        if (sl === "sd/mi" && !p.includes("sd") && !p.includes("mi"))
          return false;
        if (sl === "smp/mts" && !p.includes("smp") && !p.includes("mts"))
          return false;
        if (
          sl === "sma/ma/smk" &&
          !p.includes("sma") &&
          !p.includes("smk") &&
          !p.includes("ma")
        )
          return false;
        return true;
      });
    }

    if (selectedMapel) {
      result = result.filter((b) => b.mapel === selectedMapel);
    }
    if (bookSearchQuery) {
      const q = bookSearchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.judul || "").toLowerCase().includes(q) ||
          (b.isbn || "").includes(q),
      );
    }
    return result;
  }, [
    masterBooks,
    bookSearchQuery,
    selectedMapel,
    currentSchool,
    sessionWilayah,
  ]);

  const filteredAllocations = useMemo(() => {
    return data.allocations.filter((allocation) => {
      const student = students.find(
        (user) => user.username === allocation.studentUsername,
      );
      if (!student) return false;
      const book =
        masterBooks.find((b) => b.isbn === allocation.isbn) ||
        getBook(data, allocation.isbn);
      const s = search.toLowerCase();
      return (
        allocation.id.toLowerCase().includes(s) ||
        (student?.nama || "").toLowerCase().includes(s) ||
        (book?.judul || "").toLowerCase().includes(s)
      );
    });
  }, [data.allocations, search, students, masterBooks, data]);

  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage) || 1;
  const paginatedAllocations = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAllocations.slice(start, start + itemsPerPage);
  }, [filteredAllocations, page]);

  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(
    null,
  );
  const [previewAllocation, setPreviewAllocation] = useState<any>(null);

  const allocate = async (event: FormEvent) => {
    event.preventDefault();
    if (!studentUsername || !isbn) {
      setMessage("Silakan pilih siswa dan buku.");
      return;
    }

    const isDuplicate = data.allocations.some(
      (item) =>
        item.id !== editingAllocationId &&
        item.studentUsername === studentUsername &&
        item.isbn === isbn,
    );
    if (isDuplicate) {
      setMessage("Siswa sudah punya akses buku ini.");
      return;
    }

    try {
      await setData((current) => {

      if (editingAllocationId) {
        return {
          ...current,
          allocations: current.allocations.map((a) =>
            a.id === editingAllocationId
              ? { ...a, studentUsername, isbn, schoolId }
              : a,
          ),
        };
      } else {
        return {
          ...current,
          allocations: [
            {
              id: nextId("ALC", current.allocations.length),
              studentUsername,
              isbn,
              schoolId,
              tanggal: new Date().toISOString().slice(0, 10),
            },
            ...current.allocations,
          ],
          learning: current.learning.some(
            (item) =>
              item.studentUsername === studentUsername && item.isbn === isbn,
          )
            ? current.learning
            : [
                {
                  studentUsername,
                  isbn,
                  progress: 0,
                  durasiJam: 0,
                  terakhirDibaca: "-",
                },
                ...current.learning,
              ],
        };
      }
      });

      setMessage(
        editingAllocationId
          ? "Akses siswa berhasil diperbarui."
          : "Akses siswa berhasil dialokasikan.",
      );

      if (editingAllocationId) {
        setEditingAllocationId(null);
        setStudentUsername(
          users.filter((u) => u.role === "siswa")[0]?.username || "",
        );
        setIsbn("");
        setBookSearchQuery("");
      }
    } catch (error) {
      console.error("Gagal menyimpan alokasi siswa:", error);
      setMessage("Alokasi gagal disimpan. Silakan coba lagi.");
    }
  };

  const editAllocation = (allocation: any) => {
    setEditingAllocationId(allocation.id);
    setStudentUsername(allocation.studentUsername);
    setIsbn(allocation.isbn);
    const book =
      masterBooks.find((b) => b.isbn === allocation.isbn) ||
      getBook(data, allocation.isbn);
    setBookSearchQuery(book?.judul || allocation.isbn);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Page
      title="Alokasi Akses Siswa"
      subtitle="Berikan akses buku kepada siswa dari stok lisensi yang tersedia."
    >
      <form className="inline-form" onSubmit={allocate}>
        <div className="form-grid">
          <label>
            Siswa
            <select
              className="input-control"
              value={studentUsername}
              onChange={(e) => setStudentUsername(e.target.value)}
            >
              {students.map((student) => (
                <option key={student.id} value={student.username}>
                  {student.nama}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mata Pelajaran (Opsional)
            <select
              className="input-control"
              value={selectedMapel}
              onChange={(e) => {
                setSelectedMapel(e.target.value);
                setIsbn("");
                setBookSearchQuery("");
              }}
            >
              <option value="">Semua Mata Pelajaran</option>
              {uniqueMapels.map((mapel) => (
                <option key={mapel} value={mapel}>
                  {mapel}
                </option>
              ))}
            </select>
          </label>
          <label style={{ position: "relative" }}>
            Buku
            <input
              type="text"
              className="input-control"
              value={bookSearchQuery}
              onChange={(e) => {
                setBookSearchQuery(e.target.value);
                setIsBookDropdownOpen(true);
                if (!e.target.value) setIsbn("");
              }}
              onFocus={() => setIsBookDropdownOpen(true)}
              onBlur={() => setIsBookDropdownOpen(false)}
              placeholder="Cari judul buku atau ISBN..."
            />
            {isBookDropdownOpen && bookSearchQuery && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--bg-surface, #fff)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  marginTop: "4px",
                  zIndex: 50,
                  maxHeight: "250px",
                  overflowY: "auto",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <div
                      key={book.isbn}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent onBlur from firing before onClick
                        setIsbn(book.isbn);
                        setBookSearchQuery(book.judul);
                        setIsBookDropdownOpen(false);
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {book.judul} {book.kelas ? `(Kelas ${book.kelas})` : ""}{" "}
                        {book.jilid &&
                        String(book.jilid).toLowerCase() !== "no.jil.lengkap" &&
                        String(book.jilid).toLowerCase() !== "null"
                          ? `[${book.jilid}]`
                          : ""}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ISBN: {book.isbn}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Buku tidak ditemukan
                  </div>
                )}
              </div>
            )}
          </label>
        </div>
        <div className="button-row" style={{ marginTop: 16 }}>
          <ButtonPromax type="submit">Alokasikan Akses</ButtonPromax>
          {message && !editingAllocationId && (
            <p
              className={`status-message ${message.includes("berhasil") ? "success" : "error"}`}
            >
              {message}
            </p>
          )}
        </div>
      </form>

      <div style={{ marginBottom: 16, marginTop: 24 }}>
        <TableSearch
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Cari ID, siswa, atau buku..."
        />
      </div>

      <DataTable
        headers={["ID", "Siswa", "Buku", "Tanggal", "Aksi"]}
        headerAligns={["left", "left", "left", "left", "center"]}
      >
        {paginatedAllocations.map((allocation) => {
          const student = users.find(
            (user) => user.username === allocation.studentUsername,
          );
          const book =
            masterBooks.find((b) => b.isbn === allocation.isbn) ||
            getBook(data, allocation.isbn);
          return (
            <tr key={allocation.id}>
              <td>{allocation.id}</td>
              <td>{student?.nama ?? allocation.studentUsername}</td>
              <td>
                {book
                  ? `${book.judul} ${book.kelas ? `(Kelas ${book.kelas})` : ""} ${book.jilid && String(book.jilid).toLowerCase() !== "no.jil.lengkap" && String(book.jilid).toLowerCase() !== "null" ? `[${book.jilid}]` : ""}`.trim()
                  : allocation.isbn}
              </td>
              <td>
                {new Date(allocation.tanggal).toLocaleDateString("id-ID")}
              </td>
              <td>
                <div
                  className="action-group"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Preview"
                    onClick={() => setPreviewAllocation(allocation)}
                  >
                    <ActionSvg name="view" />
                  </button>
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Edit"
                    onClick={() => editAllocation(allocation)}
                  >
                    <ActionSvg name="edit" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <div style={{ marginTop: 16 }}>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {editingAllocationId && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => {
            setEditingAllocationId(null);
            setStudentUsername(
              users.filter((u) => u.role === "siswa")[0]?.username || "",
            );
            setIsbn("");
            setBookSearchQuery("");
            setMessage("");
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Alokasi Akses</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setEditingAllocationId(null);
                  setStudentUsername(
                    users.filter((u) => u.role === "siswa")[0]?.username || "",
                  );
                  setIsbn("");
                  setBookSearchQuery("");
                  setMessage("");
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={allocate}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Siswa
                  </label>
                  <select
                    className="input-control"
                    value={studentUsername}
                    onChange={(e) => setStudentUsername(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.username}>
                        {student.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "24px", position: "relative" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Buku
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={bookSearchQuery}
                    onChange={(e) => {
                      setBookSearchQuery(e.target.value);
                      setIsBookDropdownOpen(true);
                      if (!e.target.value) setIsbn("");
                    }}
                    onFocus={() => setIsBookDropdownOpen(true)}
                    onBlur={() => setIsBookDropdownOpen(false)}
                    placeholder="Cari judul buku atau ISBN..."
                    style={{ width: "100%" }}
                  />
                  {isBookDropdownOpen && bookSearchQuery && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--bg-surface, #fff)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        marginTop: "4px",
                        zIndex: 50,
                        maxHeight: "250px",
                        overflowY: "auto",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((book) => (
                          <div
                            key={book.isbn}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid var(--border-subtle)",
                              cursor: "pointer",
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsbn(book.isbn);
                              setBookSearchQuery(book.judul);
                              setIsBookDropdownOpen(false);
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              {book.judul}{" "}
                              {book.kelas ? `(Kelas ${book.kelas})` : ""}{" "}
                              {book.jilid &&
                              String(book.jilid).toLowerCase() !==
                                "no.jil.lengkap" &&
                              String(book.jilid).toLowerCase() !== "null"
                                ? `[${book.jilid}]`
                                : ""}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              ISBN: {book.isbn}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Buku tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {message && editingAllocationId && (
                    <span
                      className={`status-message ${message.includes("berhasil") ? "success" : "error"}`}
                      style={{ marginRight: "auto", margin: 0 }}
                    >
                      {message}
                    </span>
                  )}
                  <button
                    type="button"
                    className="button-promax"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                    onClick={() => {
                      setEditingAllocationId(null);
                      setStudentUsername(
                        users.filter((u) => u.role === "siswa")[0]?.username ||
                          "",
                      );
                      setIsbn("");
                      setBookSearchQuery("");
                      setMessage("");
                    }}
                  >
                    Batal
                  </button>
                  <ButtonPromax type="submit">Simpan Perubahan</ButtonPromax>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {previewAllocation && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setPreviewAllocation(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview Alokasi</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setPreviewAllocation(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "16px 24px",
                  alignItems: "center",
                  fontSize: "0.95rem",
                }}
              >
                <div
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  ID Alokasi
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    width: "fit-content",
                  }}
                >
                  {previewAllocation.id}
                </div>

                <div
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  Siswa
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {users.find(
                    (u) => u.username === previewAllocation.studentUsername,
                  )?.nama || previewAllocation.studentUsername}
                </div>

                <div
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  Buku
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {masterBooks.find((b) => b.isbn === previewAllocation.isbn)
                    ?.judul ||
                    getBook(data, previewAllocation.isbn)?.judul ||
                    previewAllocation.isbn}
                </div>

                <div
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  ISBN
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {previewAllocation.isbn}
                </div>

                <div
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  Tanggal Akses
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {new Date(previewAllocation.tanggal).toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export function TeacherAccess() {
  const { session } = useAuth();
  const { data, setData } = useAppData();

  const [apiUsers, setApiUsers] = useState<any[]>([]);
  const [apiBooks, setApiBooks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useMemo(
    () => apiUsers.find((u) => u.username === session?.username),
    [apiUsers, session],
  );
  const sessionSchoolId = session?.sekolahId || currentUser?.sekolah_id;
  const sessionWilayah =
    (session as any)?.wilayah || currentUser?.wilayah || "";
  const currentSchool = sessionSchoolId
    ? data.schools?.find((s: any) => s.id === sessionSchoolId)
    : data.schools?.find(
        (s: any) => s.nama?.toLowerCase() === sessionWilayah?.toLowerCase(),
      );
  const schoolId = sessionSchoolId || currentSchool?.id || 1;

  const fetchData = useCallback(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          setApiUsers(json.data);
        }
      })
      .catch(console.error);

    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          setApiBooks(json.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const teachers = useMemo(() => {
    const allUsers = apiUsers.length > 0 ? apiUsers : data.users;
    return allUsers.filter((u: any) => {
      const matchSchool =
        u.sekolah_id === schoolId ||
        u.sekolahId === schoolId ||
        (currentSchool &&
          u.wilayah?.toLowerCase() === currentSchool.nama?.toLowerCase()) ||
        (sessionWilayah &&
          u.wilayah?.toLowerCase() === sessionWilayah.toLowerCase());
      return matchSchool && u.role === "guru";
    });
  }, [apiUsers, data.users, schoolId, currentSchool, sessionWilayah]);

  const allBooks = useMemo(() => {
    let books = [...data.books, ...apiBooks];
    // Deduplicate by ISBN
    books = Array.from(
      new Map(books.map((b) => [b.isbn || b.judul, b])).values(),
    );

    const userSchoolLevel = currentSchool
      ? getSchoolLevel(currentSchool.nama)
      : getSchoolLevel(sessionWilayah);
    if (userSchoolLevel) {
      const sl = userSchoolLevel.toLowerCase();
      books = books.filter((b) => {
        const p = (b.jenjang || b.peruntukan || "").toLowerCase();
        if (p === "umum" || p.includes("semua") || p === "") return true;
        if (sl === "sd/mi" && !p.includes("sd") && !p.includes("mi"))
          return false;
        if (sl === "smp/mts" && !p.includes("smp") && !p.includes("mts"))
          return false;
        if (
          sl === "sma/ma/smk" &&
          !p.includes("sma") &&
          !p.includes("smk") &&
          !p.includes("ma")
        )
          return false;
        return true;
      });
    }
    return books;
  }, [data.books, apiBooks, currentSchool, sessionWilayah]);

  const uniqueMapels = useMemo(() => {
    const mapels = allBooks.map((b) => b.mapel).filter(Boolean);
    return Array.from(new Set(mapels)).sort();
  }, [allBooks]);

  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any>(null);
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [selectedBuku, setSelectedBuku] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const removeAllocation = (allocationId: string) => {
    setData((current) => ({
      ...current,
      allocations: current.allocations.filter((a) => a.id !== allocationId),
    }));
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setSelectedMapel(teacher.kelas || "");
    setSelectedBuku([]);
    setMessage("");
  };

  const saveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const payload = { ...editingTeacher, kelas: selectedMapel };
      const res = await fetch(`/api/users/${editingTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      const json = await res.json();
      if (json.success) {
        if (selectedBuku && selectedBuku.length > 0) {
          await setData((current) => {
            const newAllocations = [...current.allocations];
            selectedBuku.forEach((b: any) => {
              const duplicate = newAllocations.some(
                (a) =>
                  a.studentUsername === editingTeacher.username &&
                  a.isbn === b.value,
              );
              if (!duplicate) {
                newAllocations.unshift({
                  id: "ALC" + Date.now() + Math.random(),
                  studentUsername: editingTeacher.username,
                  isbn: b.value,
                  schoolId,
                  tanggal: new Date().toISOString().slice(0, 10),
                });
              }
            });
            return {
              ...current,
              allocations: newAllocations,
            };
          });
        }
        setMessage("Akses berhasil dialokasikan ke Guru.");
        setEditingTeacher(null);
        fetchData(); // Reload users
      } else {
        setMessage(json.error || "Gagal menyimpan data.");
      }
    } catch (e: any) {
      setMessage(e instanceof Error ? e.message : "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page
      title="Alokasi Akses Guru"
      subtitle="Tetapkan mata pelajaran yang diampu oleh masing-masing guru."
    >
      {editingTeacher && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setEditingTeacher(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Alokasi Mapel</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setEditingTeacher(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={saveAllocation}>
              <div className="modal-body">
                <div
                  className="form-grid"
                  style={{ gridTemplateColumns: "1fr", gap: "16px" }}
                >
                  <label>
                    Guru
                    <input
                      type="text"
                      className="input-control"
                      value={editingTeacher.nama || editingTeacher.username}
                      disabled
                    />
                  </label>
                  <label>
                    Mata Pelajaran (Opsional)
                    <select
                      className="input-control"
                      value={selectedMapel}
                      onChange={(e) => setSelectedMapel(e.target.value)}
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
                      {uniqueMapels.map((mapel) => (
                        <option key={mapel} value={mapel}>
                          {mapel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Buku Spesifik (Opsional)
                    <Select
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="-- Pilih Buku Spesifik --"
                      value={selectedBuku}
                      onChange={(selected: any) =>
                        setSelectedBuku(selected || [])
                      }
                      options={allBooks
                        .filter(
                          (b) => !selectedMapel || b.mapel === selectedMapel,
                        )
                        .map((b) => ({
                          value: b.isbn,
                          label: `${b.mapel ? `[${b.mapel}] ` : ""}${b.judul} ${b.kelas ? `(Kelas ${b.kelas})` : ""} ${b.jilid && String(b.jilid).toLowerCase() !== "no.jil.lengkap" && String(b.jilid).toLowerCase() !== "null" ? `[${b.jilid}]` : ""}`,
                        }))}
                    />
                  </label>
                </div>
              </div>
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="button-promax"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                  onClick={() => setEditingTeacher(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <ButtonPromax type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </ButtonPromax>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingTeacher && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setViewingTeacher(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview Alokasi Guru</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setViewingTeacher(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "16px 24px",
                  alignItems: "start",
                  fontSize: "0.95rem",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  Guru
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {viewingTeacher.nama}
                </div>

                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  Username
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {viewingTeacher.username}
                </div>

                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  Mata Pelajaran
                </div>
                <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {viewingTeacher.kelas || "-"}
                </div>

                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  Buku Spesifik
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {data.allocations
                    .filter((a) => a.studentUsername === viewingTeacher.username)
                    .map((a) => {
                      const book = allBooks.find((b) => b.isbn === a.isbn);
                      return (
                        <div key={a.id} style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                          {book?.judul || a.isbn}
                        </div>
                      );
                    })}
                  {!data.allocations.some(
                    (a) => a.studentUsername === viewingTeacher.username,
                  ) && <div style={{ color: "var(--text-secondary)" }}>-</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && !editingTeacher && (
        <div
          className="status-message success"
          style={{ marginBottom: "16px" }}
        >
          {message}
        </div>
      )}

      <div className="table-responsive">
        <DataTable
          headers={[
            "Nama Guru",
            "Username",
            "Mata Pelajaran Diampu",
            "Buku Spesifik",
            "Aksi",
          ]}
          headerAligns={["left", "left", "left", "left", "center"]}
        >
          {teachers.map((teacher) => {
            const guruAllocations = data.allocations.filter(
              (a) => a.studentUsername === teacher.username,
            );
            const allocatedBooksList = guruAllocations
              .map((a) => {
                const b = allBooks.find((b) => b.isbn === a.isbn);
                if (!b) return null;
                const extra = [];
                if (b.kelas) extra.push(`(Kelas ${b.kelas})`);
                if (
                  b.jilid &&
                  String(b.jilid).toLowerCase() !== "no.jil.lengkap" &&
                  String(b.jilid).toLowerCase() !== "null"
                )
                  extra.push(`[${b.jilid}]`);
                const extraStr = extra.length > 0 ? ` ${extra.join(" ")}` : "";
                return {
                  id: a.id,
                  label: `${b.mapel ? "[" + b.mapel + "] " : ""}${b.judul}${extraStr}`,
                };
              })
              .filter(Boolean);
            return (
              <tr key={teacher.id}>
                <td>{teacher.nama}</td>
                <td>
                  <Chip label={teacher.username} type="info" />
                </td>
                <td>
                  {teacher.kelas ? (
                    <span
                      style={{ fontWeight: 500, color: "var(--text-primary)" }}
                    >
                      {teacher.kelas}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      -
                    </span>
                  )}
                </td>
                <td>
                  {allocatedBooksList.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {allocatedBooksList.map((item: any, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "12px",
                            background: "var(--bg-tertiary)",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                            whiteSpace: "normal",
                            lineHeight: "1.4",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{item.label}</span>
                          <button
                            type="button"
                            onClick={() => removeAllocation(item.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--danger-main)",
                              cursor: "pointer",
                              fontSize: "16px",
                              padding: "0 4px",
                              marginLeft: "8px",
                            }}
                            title="Hapus Buku"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      -
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Lihat Akses"
                    aria-label={`Lihat akses ${teacher.nama}`}
                    onClick={() => setViewingTeacher(teacher)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-button"
                    title="Edit Akses"
                    onClick={() => handleEdit(teacher)}
                  >
                    <ActionSvg name="edit" />
                  </button>
                </td>
              </tr>
            );
          })}
          {teachers.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  padding: "24px",
                }}
              >
                Belum ada data guru.
              </td>
            </tr>
          )}
        </DataTable>
      </div>
    </Page>
  );
}

export function Library() {
  const { session } = useAuth();
  const { data } = useAppData();
  const itemsPerPage = 25;
  const [playingContent, setPlayingContent] = useState<SimContent | null>(null);
  const [contentPage, setContentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener(
        "change",
        handler as (e: MediaQueryListEvent) => void,
      );
  }, []);

  const [apiBooks, setApiBooks] = useState<any[]>([]);
  const [apiUsers, setApiUsers] = useState<any[]>([]);
  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
    )
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setApiBooks(payload.data);
        }
      })
      .catch(() => {});

    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
    )
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) {
          setApiUsers(payload.data);
        }
      })
      .catch(() => {});
  }, []);

  const libraryContents = useMemo(() => {
    if (!session) return [];

    if (session.role === "siswa") {
      const sessionSchoolId = session.sekolahId || (session as any).sekolah_id;
      const studentSchool = sessionSchoolId
        ? data.schools.find((school: any) => String(school.id) === String(sessionSchoolId))
        : null;
      const schoolLevel = getSchoolLevel(
        studentSchool?.nama || (session as any).wilayah || "",
      ).toLowerCase();
      const matchesSchoolLevel = (target: string) => {
        const normalizedTarget = String(target || "").toLowerCase();
        if (!schoolLevel || !normalizedTarget || normalizedTarget === "umum" || normalizedTarget.includes("semua")) return true;
        if (schoolLevel === "sd/mi") return normalizedTarget.includes("sd") || normalizedTarget.includes("mi");
        if (schoolLevel === "smp/mts") return normalizedTarget.includes("smp") || normalizedTarget.includes("mts");
        if (schoolLevel === "sma/ma/smk") return normalizedTarget.includes("sma") || normalizedTarget.includes("ma") || normalizedTarget.includes("smk");
        return false;
      };
      const allocatedIsbns = new Set(
        data.allocations
          .filter((a) => a.studentUsername === session.username)
          .map((a) => a.isbn),
      );
      return data.contents.filter(
        (content) =>
          content.isbn &&
          allocatedIsbns.has(content.isbn) &&
          matchesSchoolLevel(content.target),
      );
    }

    if (session.role === "guru") {
      const user =
        apiUsers.find((u) => u.username === session.username) ||
        data.schoolUsers.find((u) => u.username === session.username);
      if (!user) return [];

      const allocatedIsbns = new Set(
        data.allocations
          .filter((a) => a.studentUsername === session.username)
          .map((a) => a.isbn),
      );

      const userSchoolId =
        user.sekolah_id ||
        user.sekolahId ||
        user.schoolId ||
        session.sekolahId ||
        (session as any).sekolah_id;
      const school = data.schools.find((s: any) => s.id === userSchoolId);
      const sessionWilayah = (session as any).wilayah || "";
      const userSchoolLevel = school
        ? getSchoolLevel(school.nama)
        : getSchoolLevel(sessionWilayah);
      const sl = userSchoolLevel ? userSchoolLevel.toLowerCase() : "";

      const allBooks = apiBooks.length > 0 ? apiBooks : data.books;
      if (user.kelas) {
        allBooks
          .filter((b: any) => {
            if (b.mapel !== user.kelas) return false;
            if (sl) {
              const p = (b.jenjang || b.peruntukan || "").toLowerCase();
              if (p === "umum" || p.includes("semua") || p === "") return true;
              if (sl === "sd/mi" && !p.includes("sd") && !p.includes("mi"))
                return false;
              if (sl === "smp/mts" && !p.includes("smp") && !p.includes("mts"))
                return false;
              if (
                sl === "sma/ma/smk" &&
                !p.includes("sma") &&
                !p.includes("smk") &&
                !p.includes("ma")
              )
                return false;
            }
            return true;
          })
          .forEach((b: any) => {
            allocatedIsbns.add(b.isbn);
          });
      }

      return data.contents.filter((c) => c.isbn && allocatedIsbns.has(c.isbn));
    }

    return data.contents;
  }, [
    data.contents,
    data.allocations,
    data.schoolUsers,
    data.books,
    apiBooks,
    apiUsers,
    session,
  ]);

  const contentTotalPages = Math.max(
    1,
    Math.ceil(libraryContents.length / itemsPerPage),
  );
  const paginatedContents = useMemo(() => {
    const start = (contentPage - 1) * itemsPerPage;
    return libraryContents.slice(start, start + itemsPerPage);
  }, [libraryContents, contentPage]);

  return (
    <Page
      title="Rak Buku Saya"
      subtitle="Buku yang sudah dialokasikan ke akun siswa demo."
      hideHeader
    >
      {!isMobile && (
        <div className="play-content-table" style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 16 }}>Daftar Konten Belajar</h4>
          <DataTable
            headers={[
              "Thumbnail",
              "Judul",
              "Kategori",
              "Target",
              "Status",
              "Aksi",
            ]}
            headerAligns={[
              "center",
              "left",
              "left",
              "left",
              "center",
              "center",
            ]}
          >
            {paginatedContents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Belum ada konten belajar.
                </td>
              </tr>
            ) : (
              paginatedContents.map((content) => (
                <tr key={content.id}>
                  <td>
                    <ContentThumbnail
                      content={content}
                      onPlay={() => setPlayingContent(content)}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {content.judul}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}
                    </div>
                  </td>
                  <td>
                    <Chip
                      type={content.status === "Terbit" ? "success" : "warning"}
                      label={content.kategori}
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem" }}>
                      {content.target}
                    </span>
                  </td>
                  <td>{content.status}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="icon-action-button"
                        aria-label={`Putar ${content.judul}`}
                        title="Putar"
                        onClick={() => setPlayingContent(content)}
                        style={{
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          padding: "6px",
                        }}
                      >
                        <ActionSvg name="play" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={contentPage}
              totalPages={contentTotalPages}
              onPageChange={setContentPage}
            />
          </div>
        </div>
      )}

      {isMobile && (
        <div className="player-mobile-list" style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 16, fontSize: "1.1rem" }}>
            Daftar Konten Belajar
          </h4>
          {paginatedContents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--text-secondary)",
              }}
            >
              Belum ada konten belajar.
            </div>
          ) : (
            paginatedContents.map((content) => {
              const thumbSrc = thumbnailForContent(content);
              const isAutoVideo =
                content.kategori === "Video" &&
                !content.thumbnailUrl &&
                content.sourceUrl;
              return (
                <div key={content.id} className="player-content-card">
                  <div className="card-header">
                    <div className="card-title">{content.judul}</div>
                    <div className="card-subtitle">{content.mapel}{content.bab ? ` · Bab ${content.bab}` : ""}</div>
                  </div>
                  <div
                    className="card-thumbnail"
                    onClick={() => setPlayingContent(content)}
                  >
                    <img
                      src={thumbSrc}
                      alt={content.judul}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {isAutoVideo && (
                      <video
                        src={`${content.sourceUrl}#t=2`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          zIndex: 1,
                        }}
                        preload="auto"
                        muted
                        playsInline
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="card-badge">{content.kategori}</div>
                    <div className="play-button">
                      <ActionSvg name="play" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div style={{ marginTop: 16 }}>
            <TablePagination
              currentPage={contentPage}
              totalPages={contentTotalPages}
              onPageChange={setContentPage}
            />
          </div>
        </div>
      )}

      {playingContent && (
        <div
          className="content-modal-backdrop play-content-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Putar ${playingContent.judul}`}
          onClick={() => setPlayingContent(null)}
        >
          <div
            className="content-modal play-content-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="content-modal-header">
              <div>
                <span className="preview-kicker">Player Konten</span>
                <h2>{playingContent.judul}</h2>
              </div>
              <button
                type="button"
                className="icon-action-button"
                onClick={() => setPlayingContent(null)}
                aria-label="Tutup player"
              >
                &times;
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <ContentPlayerStage content={playingContent} />
              <RelatedContents
                currentContent={playingContent}
                allContents={libraryContents}
                onPlay={setPlayingContent}
              />
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export function LearningHistory() {
  const { data, setData } = useAppData();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/users`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) setUsers(res.data);
      })
      .catch(console.error);
  }, []);

  const addProgress = (studentUsername: string, isbn: string) => {
    setData((current) => ({
      ...current,
      learning: current.learning.map((item) =>
        item.studentUsername === studentUsername && item.isbn === isbn
          ? {
              ...item,
              progress: Math.min(item.progress + 5, 100),
              durasiJam: item.durasiJam + 1,
              terakhirDibaca: new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),
            }
          : item,
      ),
    }));
  };

  return (
    <Page
      title="Riwayat Belajar"
      subtitle="Pantau aktivitas baca siswa, lengkap dengan progress."
    >
      <DataTable
        headers={["Siswa", "Buku", "Durasi", "Progress", "Aksi"]}
        headerAligns={["left", "left", "center", "center", "center"]}
      >
        {data.learning.map((item) => {
          const student = users.find(
            (user) => user.username === item.studentUsername,
          );
          const book = getBook(data, item.isbn);
          return (
            <tr key={`${item.studentUsername}-${item.isbn}`}>
              <td>{student?.nama ?? item.studentUsername}</td>
              <td>{book?.judul ?? item.isbn}</td>
              <td>{item.durasiJam} jam</td>
              <td style={{ minWidth: 180 }}>
                <Progress value={item.progress} />
              </td>
              <td>
                <div className="action-group">
                  <button
                    className="action-button"
                    onClick={() => addProgress(item.studentUsername, item.isbn)}
                  >
                    +5% Progress
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </Page>
  );
}

function MetricCard({
  icon,
  color,
  title,
  value,
  subtitle,
}: {
  icon: string;
  color: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon-wrapper" style={{ color }}>
        {icon}
      </div>
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

function previewModeForCategory(
  category: ContentCategory,
): SimContent["previewMode"] {
  const map: Record<ContentCategory, SimContent["previewMode"]> = {
    Teks: "text",
    Infografi: "infografis",
    Video: "video",
    "Games HTML5": "game",
  };
  return map[category];
}

function thumbnailKeyForCategory(
  category: ContentCategory,
): SimContent["thumbnailKey"] {
  const map: Record<ContentCategory, SimContent["thumbnailKey"]> = {
    Teks: "text",
    Infografi: "infografis",
    Video: "video",
    "Games HTML5": "game",
  };
  return map[category];
}

function generatedThumbnailForContent(content: SimContent) {
  return thumbnailDraftSrc(
    content.kategori,
    content.judul,
    content.target,
    thumbnailKeyForCategory(content.kategori),
  );
}

function thumbnailForContent(content: SimContent) {
  if (content.thumbnailUrl) return content.thumbnailUrl;
  if (content.kategori === "Infografi" && content.sourceUrl)
    return content.sourceUrl;
  return generatedThumbnailForContent(content);
}

function ContentThumbnail({
  content,
  onPlay,
}: {
  content: SimContent;
  onPlay?: () => void;
}) {
  const fallback = thumbnailForContent(content);
  const generatedFallback = generatedThumbnailForContent(content);
  const [imgSrc, setImgSrc] = useState(fallback);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (content.thumbnailUrl) {
      setImgSrc(fallback);
      return;
    }
    
    // Lazy load the thumbnail for the list view since it was stripped from the main payload
    fetch(`/api/content-thumbnail?id=${content.id}`)
      .then(res => res.json())
      .then(data => {
        if (active && data.success && data.thumbnailUrl) {
          setImgSrc(data.thumbnailUrl);
        } else if (active) {
          setImgSrc(fallback);
        }
      })
      .catch(() => {
        if (active) setImgSrc(fallback);
      });
      
    return () => { active = false; };
  }, [content.id, content.thumbnailUrl, fallback]);

  const isAutoVideoThumb =
    content.kategori === "Video" &&
    !content.thumbnailUrl &&
    content.sourceUrl &&
    !videoFailed;

  const thumbnail = (
    <span className="content-thumbnail-frame">
      {isAutoVideoThumb ? (
        <video
          className="content-thumbnail"
          src={`${content.sourceUrl}#t=2`}
          preload="none"
          poster={generatedFallback}
          muted
          playsInline
          style={{ objectFit: "cover", pointerEvents: "none" }}
          onError={() => setVideoFailed(true)}
          ref={(el) => {
            if (el)
              el.onmouseenter = () => {
                if (el.preload === "none") el.preload = "metadata";
              };
          }}
        />
      ) : (
        <img
          className="content-thumbnail"
          src={imgSrc}
          alt={content.judul}
          loading="lazy"
          onError={(e) => {
            if (imgSrc !== generatedFallback) {
              setImgSrc(generatedFallback);
            } else {
              e.currentTarget.style.display = "none";
            }
          }}
        />
      )}
      {(content.kategori === "Video" || content.kategori === "Games HTML5") && (
        <span className="content-thumbnail-play" aria-hidden="true">
          <ActionSvg name="play" />
        </span>
      )}
    </span>
  );

  return onPlay ? (
    <button
      type="button"
      className="content-thumbnail-button"
      onClick={onPlay}
      aria-label={`Putar ${content.judul}`}
      title="Putar konten"
    >
      {thumbnail}
    </button>
  ) : (
    thumbnail
  );
}

function contentAcceptForCategory(category: ContentCategory) {
  const accepts: Record<ContentCategory, string> = {
    Teks: ".pdf,application/pdf",
    Infografi: ".png,.jpg,.jpeg,.webp,.gif,image/*",
    Video: ".mp4,.webm,.ogg,.mov,video/*",
    "Games HTML5":
      ".zip,.html,.htm,application/zip,application/x-zip-compressed,text/html",
  };
  return accepts[category];
}

function getUploadContentType(file: File, category: ContentCategory) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "zip") return "application/zip";
  if (extension === "html" || extension === "htm") return "text/html";
  if (category === "Games HTML5") return "application/zip";
  if (extension === "pdf") return "application/pdf";
  return "application/octet-stream";
}

function thumbnailDraftSrc(
  category: ContentCategory,
  title: string,
  target: string,
  key: SimContent["thumbnailKey"] = thumbnailKeyForCategory(category),
) {
  const palette: Record<SimContent["thumbnailKey"], [string, string, string]> =
    {
      text: ["#0f172a", "#2563eb", "#38bdf8"],
      infografis: ["#0f172a", "#14b8a6", "#22c55e"],
      video: ["#0b1120", "#1d4ed8", "#0ea5e9"],
      game: ["#111827", "#7c3aed", "#ec4899"],
    };
  const [start, mid, end] = palette[key] || palette.text;
  const badge =
    key === "text"
      ? "TEKS"
      : key === "infografis"
        ? "INFOGRAFIS"
        : key === "video"
          ? "VIDEO"
          : "GAMES HTML5";
  const icon =
    key === "text"
      ? `<g><rect x="52" y="56" width="160" height="220" rx="20" fill="rgba(255,255,255,0.16)"/><rect x="78" y="88" width="106" height="12" rx="6" fill="white"/><rect x="78" y="116" width="84" height="10" rx="5" fill="rgba(255,255,255,0.82)"/><rect x="78" y="144" width="120" height="10" rx="5" fill="rgba(255,255,255,0.62)"/><rect x="78" y="172" width="96" height="10" rx="5" fill="rgba(255,255,255,0.62)"/></g>`
      : key === "infografis"
        ? `<g><circle cx="115" cy="160" r="44" fill="white"/><circle cx="115" cy="160" r="23" fill="${mid}"/><circle cx="206" cy="98" r="18" fill="rgba(255,255,255,0.9)"/><circle cx="236" cy="160" r="26" fill="rgba(255,255,255,0.9)"/><circle cx="196" cy="226" r="20" fill="rgba(255,255,255,0.9)"/><path d="M135 144 186 114M135 160 208 160M135 176 184 212" stroke="white" stroke-width="10" stroke-linecap="round"/></g>`
        : key === "video"
          ? `<g><rect x="48" y="70" width="190" height="170" rx="26" fill="rgba(255,255,255,0.14)"/><circle cx="142" cy="155" r="56" fill="rgba(255,255,255,0.92)"/><path d="m124 128 52 27-52 27z" fill="${mid}"/><rect x="70" y="258" width="150" height="12" rx="6" fill="rgba(255,255,255,0.72)"/></g>`
          : `<g><rect x="48" y="62" width="192" height="196" rx="28" fill="rgba(255,255,255,0.12)"/><circle cx="116" cy="120" r="20" fill="rgba(255,255,255,0.92)"/><circle cx="182" cy="120" r="20" fill="rgba(255,255,255,0.92)"/><path d="M88 152h92M96 186h76" stroke="white" stroke-width="12" stroke-linecap="round"/><rect x="74" y="218" width="144" height="18" rx="9" fill="${mid}"/></g>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}" />
          <stop offset="0.55" stop-color="${mid}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="18%" r="75%">
          <stop offset="0" stop-color="rgba(255,255,255,0.35)" />
          <stop offset="1" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="960" height="540" rx="44" fill="url(#bg)" />
      <circle cx="820" cy="100" r="190" fill="url(#glow)" />
      <circle cx="140" cy="455" r="170" fill="rgba(255,255,255,0.08)" />
      ${icon}
      <rect x="48" y="346" width="260" height="38" rx="19" fill="rgba(255,255,255,0.14)" />
      <text x="66" y="372" fill="white" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="1.2">${badge}</text>
      <text x="52" y="442" fill="white" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800">${escapeSvgText(truncateText(String(title || ""), 32))}</text>
      <text x="52" y="488" fill="rgba(255,255,255,0.82)" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">${escapeSvgText(String(target || "UMUM"))}</text>
      <text x="928" y="500" text-anchor="end" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700">KONTENMU PREVIEW</text>
    </svg>
  `)}`;
}

function escapeSvgText(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncateText(value: string, max = 32) {
  const str = String(value || "");
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Gagal membaca file thumbnail."));
    reader.readAsDataURL(file);
  });
}

function HtmlGamePreview({ content }: { content: SimContent }) {
  if (!content.sourceUrl) {
    return (
      <div className="text-preview-copy">
        <span className="preview-chip">Games HTML5</span>
        <strong>File game belum tersedia</strong>
        <p>
          Konten lama ini tidak memiliki file HTML yang dapat diputar. Unggah
          ulang file game untuk membukanya di player.
        </p>
      </div>
    );
  }

  return (
    <iframe
      className="preview-media html-game-preview"
      src={content.sourceUrl?.replace("/api/media/", "/api/media/v2/")}
      title={`Game: ${content.judul}`}
      sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
      referrerPolicy="no-referrer"
      scrolling="no"
      style={{ touchAction: "none" }}
    />
  );
}

function Page({
  title,
  subtitle,
  children,
  hideHeader = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <div className="page-shell">
      <GlassCard style={{ width: "100%" }}>
        {!hideHeader && (
          <div className="panel-heading">
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </GlassCard>
    </div>
  );
}

function RelatedContents({
  currentContent,
  allContents,
  onPlay,
}: {
  currentContent: SimContent;
  allContents: SimContent[];
  onPlay: (c: SimContent) => void;
}) {
  if (!currentContent.isbn) return null;

  const related = allContents.filter(
    (c) => c.isbn === currentContent.isbn && c.id !== currentContent.id,
  );

  if (related.length === 0) return null;

  const infografis = related.filter((c) => c.kategori === "Infografi");
  const videos = related.filter((c) => c.kategori === "Video");
  const games = related.filter((c) => c.kategori === "Games HTML5");

  if (infografis.length === 0 && videos.length === 0 && games.length === 0)
    return null;

  return (
    <div
      className="related-contents-section"
      style={{
        marginTop: "24px",
        padding: "16px",
        borderTop: "1px solid var(--border-color, #e5e7eb)",
        backgroundColor: "var(--bg-surface, #f9fafb)",
        borderRadius: "0 0 12px 12px",
        flexShrink: 0,
      }}
    >
      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 12px" }}>
        Materi Terkait Buku Ini
      </h3>

      {infografis.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary, #666)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Info Grafis
          </h4>
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
            }}
          >
            {infografis.map((c) => (
              <div key={c.id} style={{ width: "160px", flexShrink: 0 }}>
                <ContentThumbnail content={c} onPlay={() => onPlay(c)} />
                <div
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                  title={c.judul}
                >
                  {c.judul}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary, #666)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Video
          </h4>
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
            }}
          >
            {videos.map((c) => (
              <div key={c.id} style={{ width: "160px", flexShrink: 0 }}>
                <ContentThumbnail content={c} onPlay={() => onPlay(c)} />
                <div
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                  title={c.judul}
                >
                  {c.judul}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {games.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h4
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary, #666)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Games
          </h4>
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
            }}
          >
            {games.map((c) => (
              <div key={c.id} style={{ width: "160px", flexShrink: 0 }}>
                <ContentThumbnail content={c} onPlay={() => onPlay(c)} />
                <div
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                  title={c.judul}
                >
                  {c.judul}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentPlayerStage({
  content,
  featured = false,
}: {
  content: SimContent | null;
  featured?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewTrackedRef = useRef<Set<string>>(new Set());
  const watchSessionRef = useRef<{ id: string; start: number } | null>(null);

  const reportWatchTime = (session: { id: string; start: number }) => {
    const elapsed = Math.round((Date.now() - session.start) / 1000);
    if (elapsed > 0) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id, type: "watch_time", watchTime: elapsed })
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (content?.previewMode === "video" && videoRef.current) {
      const video = videoRef.current;
      video.pause();
      if (watchSessionRef.current) {
        reportWatchTime(watchSessionRef.current);
        watchSessionRef.current = null;
      }
      video.src = content.sourceUrl ?? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      video.load();

      const handlePlay = () => {
        if (!viewTrackedRef.current.has(content.id)) {
          viewTrackedRef.current.add(content.id);
          fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: content.id, type: "view" })
          }).catch(() => {});
        }
        if (!watchSessionRef.current) {
          watchSessionRef.current = { id: content.id, start: Date.now() };
        }
      };

      const handlePauseOrEnd = () => {
        if (watchSessionRef.current) {
          reportWatchTime(watchSessionRef.current);
          watchSessionRef.current = null;
        }
      };

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePauseOrEnd);
      video.addEventListener("ended", handlePauseOrEnd);

      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePauseOrEnd);
        video.removeEventListener("ended", handlePauseOrEnd);
        if (watchSessionRef.current) {
          reportWatchTime(watchSessionRef.current);
          watchSessionRef.current = null;
        }
      };
    }
  }, [content?.sourceUrl, content?.previewMode, content?.id]);

  useEffect(() => {
    const syncFullscreen = () =>
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement === stage) {
      await document.exitFullscreen();
      return;
    }
    await stage.requestFullscreen?.();
  };

  if (!content) {
    return (
      <div
        ref={stageRef}
        className={`protected-preview-stage empty ${featured ? "featured" : ""}`}
      >
        <button
          type="button"
          className="player-fullscreen-button"
          onClick={toggleFullscreen}
          title="Fullscreen"
          aria-label="Fullscreen"
        >
          <ActionSvg name="fullscreen" />
        </button>
        <div className="text-preview-copy">
          <span className="preview-chip">Konten Siap Diputar</span>
          <strong>Belum ada konten dipilih</strong>
          <p>
            Pilih konten dari daftar untuk memutar video, membuka infografis,
            membaca materi, atau mencoba games HTML5.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className={`protected-preview-stage ${featured ? "featured" : ""}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="preview-watermark">KontenMu Protected</div>
      <div className="preview-watermark-center">KontenMu</div>
      <button
        type="button"
        className={`player-fullscreen-button ${isFullscreen ? "active" : ""}`}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
        aria-label={isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
      >
        <ActionSvg name="fullscreen" />
      </button>
      {content.previewMode === "video" && (
        <video
          ref={videoRef}
          className="preview-media"
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="auto"
          poster={thumbnailForContent(content)}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
      {content.previewMode === "infografis" && (
        <img
          className="preview-media image"
          src={content.sourceUrl ?? thumbnailForContent(content)}
          alt={content.judul}
        />
      )}
      {content.previewMode === "text" && (
        <div className="text-preview-copy">
          <span className="preview-chip">Dokumen Terkunci</span>
          <strong>{content.judul}</strong>
          <p>
            Materi inti disajikan sebagai pratinjau aman. Akses penuh memerlukan
            login dan token pengguna yang valid untuk mencegah pengambilan file
            langsung.
          </p>
          <ul>
            <li>Mode baca saja</li>
            <li>Watermark otomatis</li>
            <li>Unduhan dinonaktifkan</li>
          </ul>
        </div>
      )}
      {content.previewMode === "game" && <HtmlGamePreview content={content} />}
    </div>
  );
}

function ActionSvg({
  name,
}: {
  name: "edit" | "delete" | "view" | "check" | "play" | "fullscreen";
}) {
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
    check: (
      <>
        <path d="m5 13 4 4L19 7" />
      </>
    ),
    play: (
      <>
        <path d="M9 7v10l8-5-8-5Z" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
    fullscreen: (
      <>
        <path d="M4 9V4h5" />
        <path d="M20 9V4h-5" />
        <path d="M4 15v5h5" />
        <path d="M20 15v5h-5" />
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

function DataTable({
  headers,
  children,
  headerAligns,
}: {
  headers: string[];
  children: ReactNode;
  headerAligns?: ("left" | "center" | "right")[];
}) {
  const tableId = useMemo(
    () => "t" + Math.random().toString(36).substr(2, 9),
    [],
  );
  return (
    <div className="table-scroll">
      {headerAligns && (
        <style>
          {headerAligns
            .map((align, index) =>
              align !== "left"
                ? `.${tableId} td:nth-child(${index + 1}) { text-align: ${align}; }`
                : "",
            )
            .join("\n")}
        </style>
      )}
      <table className={`table-promax ${tableId}`}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                style={{ textAlign: headerAligns?.[index] || "left" }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
      <strong
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          minWidth: 38,
        }}
      >
        {value}%
      </strong>
    </div>
  );
}

const loadOrganizations = async (inputValue: string, tingkat: number, parentId?: number | null) => {
  if (!inputValue && !parentId) return [];
  try {
    let baseUrl = `https://staging.kawalmu.pages.dev/api/organizations?tingkat=${tingkat}&limit=100`;
    if (inputValue) baseUrl += `&search=${encodeURIComponent(inputValue)}`;
    if (parentId) baseUrl += `&parent_id=${parentId}`;

    const urls = [baseUrl];
    // Workaround: PWM data in the API sometimes ends up in tingkat=1 (e.g. "Jawa Timur")
    if (tingkat === 2) {
      let pwmFallback = `https://staging.kawalmu.pages.dev/api/organizations?tingkat=1&limit=100`;
      if (inputValue) pwmFallback += `&search=${encodeURIComponent(inputValue)}`;
      urls.push(pwmFallback);
    }

    const responses = await Promise.all(urls.map(url => fetch(url)));
    let allData: any[] = [];
    
    for (const res of responses) {
      const json = await res.json();
      if (json.success && json.data) {
        allData = [...allData, ...json.data];
      }
    }

    return allData.map((org: any) => ({
      label: org.nama,
      value: org.nama,
      id: org.id
    }));
  } catch (error) {
    console.error("Error fetching organizations", error);
    return [];
  }
};
export function MasterSekolah() {
  const { session } = useAuth();
  const isSuperadmin = session?.role === "superadmin";
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [schools, setSchools] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [jenjangFilter, setJenjangFilter] = useState("Semua");

  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<number | null>(null);
  const [viewingSchool, setViewingSchool] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPwmId, setSelectedPwmId] = useState<number | null>(null);
  const [selectedPdmId, setSelectedPdmId] = useState<number | null>(null);
  const [selectedPcmId, setSelectedPcmId] = useState<number | null>(null);
  const [formSchool, setFormSchool] = useState({
    npsn: "",
    nama: "",
    jenjang: "SD",
    kabupaten: "",
    provinsi: "",
    alamat: "",
    logoUrl: "",
    gmapUrl: "",
    prm: "",
    pcm: "",
    pdm: "",
    pwm: "",
    lintang: "",
    bujur: "",
    telepon: "",
    email: "",
    website: "",
    status: "Aktif",
  });

  const clearForm = () => {
    setFormSchool({
      npsn: "",
      nama: "",
      jenjang: "SD",
      kabupaten: "",
      provinsi: "",
      alamat: "",
      logoUrl: "",
      gmapUrl: "",
      prm: "",
      pcm: "",
      pdm: "",
      pwm: "",
      lintang: "",
      bujur: "",
      telepon: "",
      email: "",
      website: "",
      status: "Aktif",
    });
    setEditingSchoolId(null);
    setSelectedPwmId(null);
    setSelectedPdmId(null);
    setSelectedPcmId(null);
    setErrorMessage("");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2MB!");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setFormSchool((prev) => ({ ...prev, logoUrl: data.url }));
      } else {
        alert(data.error || "Gagal mengunggah logo");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi manual agar muncul pesan error yang jelas (menghindari error diam HTML5)
    if (!formSchool.npsn || !formSchool.nama) {
      setErrorMessage("NPSN dan Nama Sekolah wajib diisi!");
      // scroll ke atas agar pesan error terlihat
      const modalElement = document.querySelector(".modal-content");
      if (modalElement) {
        modalElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const method = editingSchoolId ? "PUT" : "POST";
      const url = editingSchoolId ? `/api/schools/${editingSchoolId}` : "/api/schools";
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(formSchool),
      });
      const data = await res.json();
      if (data.success) {
        setIsSchoolModalOpen(false);
        clearForm();
        setRefreshKey((k) => k + 1);
      } else {
        setErrorMessage((data.error || "Terjadi kesalahan") + (data.debug ? " | Debug: " + JSON.stringify(data.debug) : ""));
        console.error("Save error:", data.error);
      }
    } catch (err) {
      setErrorMessage("Gagal menyimpan data sekolah");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchool = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus sekolah ini?")) return;
    try {
      const res = await fetch(`/api/schools/${id}`, { 
        method: "DELETE",
        headers: {
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setRefreshKey((k) => k + 1);
      } else {
        console.error("Delete error:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (school: any) => {
    try {
      const newStatus = school.status === "Aktif" ? "Tidak Aktif" : "Aktif";
      const res = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRefreshKey((k) => k + 1);
      } else {
        console.error("Status toggle error:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const url =
        `/api/schools?page=${currentPage}&limit=15` +
        (searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "") +
        (jenjangFilter !== "Semua" ? `&jenjang=${encodeURIComponent(jenjangFilter)}` : "");
      fetch(url)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            setSchools(resData.data);
            setTotalPages(Math.ceil(resData.total / resData.limit));
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, jenjangFilter, refreshKey]);

  return (
    <GlassCard>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Master Sekolah
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Daftar sekolah yang terdaftar di sistem KontenMu.
          </p>
        </div>
        {isSuperadmin && (
          <div className="button-row">
            <ButtonPromax onClick={() => { clearForm(); setIsSchoolModalOpen(true); }}>+ Tambah Sekolah</ButtonPromax>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <TableSearch
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              setCurrentPage(1);
            }}
            placeholder="Cari NPSN / Nama Sekolah..."
          />
        </div>
        <select
          value={jenjangFilter}
          onChange={(e) => {
            setJenjangFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            outline: "none",
            height: "40px",
          }}
        >
          <option value="Semua">Semua Jenjang</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
          <option value="SMK">SMK</option>
          <option value="MI">MI</option>
          <option value="MTs">MTs</option>
          <option value="MA">MA</option>
        </select>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          Memuat data sekolah...
        </div>
      ) : (
        <DataTable
          headers={[
            "NPSN",
            "NAMA SEKOLAH",
            "JENJANG",
            "KOTA / KABUPATEN",
            "AGEN",
            "STATUS",
            "AKSI",
          ]}
          headerAligns={["left", "left", "left", "left", "left", "center", "right"]}
        >
          {schools.map((school) => {
            return (
              <tr key={school.id}>
                <td>
                  <span
                    className="mono-text"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {school.npsn}
                  </span>
                </td>
                <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {school.nama}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {school.jenjang || "-"}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {school.kabupaten || "-"}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {school.agen || "-"}
                </td>
                <td style={{ textAlign: "center", cursor: isSuperadmin ? "pointer" : "default" }} onClick={() => isSuperadmin && handleToggleStatus(school)}>
                  {school.status === "Aktif" ? (
                    <div title={isSuperadmin ? "Aktif (Klik untuk ubah)" : "Aktif"} style={{ color: "var(--success-color, #22c55e)", display: "flex", justifyContent: "center" }}>
                      <CheckCircle2 size={20} />
                    </div>
                  ) : (
                    <div title={isSuperadmin ? "Tidak Aktif (Klik untuk ubah)" : "Tidak Aktif"} style={{ color: "var(--text-secondary)", display: "flex", justifyContent: "center" }}>
                      <XCircle size={20} opacity={0.5} />
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="icon-action-button"
                      aria-label="Lihat"
                      title="Lihat"
                      onClick={() => setViewingSchool(school)}
                    >
                      <ActionSvg name="view" />
                    </button>
                    {isSuperadmin && (
                      <>
                        <button
                          type="button"
                          className="icon-action-button"
                          aria-label="Edit"
                          title="Edit"
                          onClick={() => {
                            setFormSchool({
                              npsn: school.npsn || "",
                              nama: school.nama || "",
                              jenjang: school.jenjang || "SD",
                              kabupaten: school.kabupaten || "",
                              provinsi: school.provinsi || "",
                              alamat: school.alamat || "",
                              logoUrl: school.logoUrl || "",
                              gmapUrl: school.gmapUrl || "",
                              prm: school.prm || "",
                              pcm: school.pcm || "",
                              pdm: school.pdm || "",
                              pwm: school.pwm || "",
                              lintang: school.lintang || "",
                              bujur: school.bujur || "",
                              telepon: school.telepon || "",
                              email: school.email || "",
                              website: school.website || "",
                              status: school.status || "Aktif",
                            });
                            setEditingSchoolId(school.id);
                            setIsSchoolModalOpen(true);
                          }}
                        >
                          <ActionSvg name="edit" />
                        </button>
                        <button
                          type="button"
                          className="icon-action-button danger"
                          aria-label="Hapus"
                          title="Hapus"
                          onClick={() => handleDeleteSchool(school.id)}
                        >
                          <ActionSvg name="delete" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {schools.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "var(--text-secondary)",
                }}
              >
                Tidak ada data sekolah.
              </td>
            </tr>
          )}
        </DataTable>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: "24px" }}>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {isSchoolModalOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => {
            setIsSchoolModalOpen(false);
            clearForm();
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "24px", maxWidth: "500px", width: "100%" }}>
            <div className="modal-header" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>
                {editingSchoolId ? "Edit Master Sekolah" : "Tambah Sekolah Baru"}
              </h3>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setIsSchoolModalOpen(false);
                  clearForm();
                }}
              >
                ×
              </button>
            </div>
            
            {errorMessage && (
              <div
                className="status-message error"
                style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px", background: "var(--danger-color, #ef4444)", color: "white", fontSize: "0.9rem" }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveSchool} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>NPSN</label>
                <input
                  type="text"
                  value={formSchool.npsn}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, npsn: e.target.value })
                  }
                  placeholder="Masukkan NPSN"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Nama Sekolah</label>
                <input
                  type="text"
                  value={formSchool.nama}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, nama: e.target.value })
                  }
                  placeholder="Nama Sekolah"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Jenjang</label>
                <select
                  value={formSchool.jenjang}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, jenjang: e.target.value })
                  }
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                  <option value="MI">MI</option>
                  <option value="MTs">MTs</option>
                  <option value="MA">MA</option>
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Kota / Kabupaten</label>
                <input
                  type="text"
                  value={formSchool.kabupaten}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, kabupaten: e.target.value })
                  }
                  placeholder="Contoh: Kab. Gresik"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Provinsi</label>
                <input
                  type="text"
                  value={formSchool.provinsi}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, provinsi: e.target.value })
                  }
                  placeholder="Provinsi"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Alamat Lengkap</label>
                <textarea
                  value={formSchool.alamat}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, alamat: e.target.value })
                  }
                  placeholder="Alamat Lengkap"
                  rows={3}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%", fontFamily: "inherit" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Upload Logo Sekolah (Max 2MB)</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", flex: 1 }}
                  />
                  {isUploadingLogo && <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Mengunggah...</span>}
                </div>
                {formSchool.logoUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <img src={formSchool.logoUrl} alt="Logo" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>{formSchool.logoUrl}</span>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Paste Lokasi Google Map</label>
                <input
                  type="text"
                  value={formSchool.gmapUrl}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, gmapUrl: e.target.value })
                  }
                  placeholder="Link GMap..."
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>No Telepon (Opsional)</label>
                  <input
                    type="text"
                    value={formSchool.telepon}
                    onChange={(e) =>
                      setFormSchool({ ...formSchool, telepon: e.target.value })
                    }
                    placeholder="Contoh: 021-1234567"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Email (Opsional)</label>
                  <input
                    type="email"
                    value={formSchool.email}
                    onChange={(e) =>
                      setFormSchool({ ...formSchool, email: e.target.value })
                    }
                    placeholder="Contoh: info@sekolah.sch.id"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Website (Opsional)</label>
                  <input
                    type="url"
                    value={formSchool.website}
                    onChange={(e) =>
                      setFormSchool({ ...formSchool, website: e.target.value })
                    }
                    placeholder="Contoh: https://www.sekolah.sch.id"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Latitude (Opsional)</label>
                  <input
                    type="text"
                    value={formSchool.lintang}
                    onChange={(e) =>
                      setFormSchool({ ...formSchool, lintang: e.target.value })
                    }
                    placeholder="-7.12345"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Longitude (Opsional)</label>
                  <input
                    type="text"
                    value={formSchool.bujur}
                    onChange={(e) =>
                      setFormSchool({ ...formSchool, bujur: e.target.value })
                    }
                    placeholder="112.12345"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 600 }}>Master Organisasi</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>PWM (Wilayah)</label>
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      placeholder="Ketik untuk mencari PWM..."
                      loadOptions={(input) => loadOrganizations(input, 2)}
                      value={formSchool.pwm ? { label: formSchool.pwm, value: formSchool.pwm } : null}
                      onChange={(selected: any) => {
                        setSelectedPwmId(selected ? selected.id : null);
                        setFormSchool({ ...formSchool, pwm: selected ? selected.value : "", pdm: "", pcm: "", prm: "" });
                        setSelectedPdmId(null);
                        setSelectedPcmId(null);
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      noOptionsMessage={({ inputValue }) => inputValue ? "Tidak ditemukan" : "Ketik untuk mencari..."}
                    />
                  </div>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>PDM (Daerah)</label>
                    <AsyncSelect
                      key={`pdm-${selectedPwmId || 'all'}`}
                      cacheOptions
                      defaultOptions
                      placeholder="Ketik untuk mencari PDM..."
                      loadOptions={(input) => loadOrganizations(input, 3, selectedPwmId)}
                      value={formSchool.pdm ? { label: formSchool.pdm, value: formSchool.pdm } : null}
                      onChange={(selected: any) => {
                        setSelectedPdmId(selected ? selected.id : null);
                        setFormSchool({ ...formSchool, pdm: selected ? selected.value : "", pcm: "", prm: "" });
                        setSelectedPcmId(null);
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      noOptionsMessage={({ inputValue }) => inputValue ? "Tidak ditemukan" : "Ketik untuk mencari..."}
                    />
                  </div>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>PCM (Cabang)</label>
                    <AsyncSelect
                      key={`pcm-${selectedPdmId || 'all'}`}
                      cacheOptions
                      defaultOptions
                      placeholder="Ketik untuk mencari PCM..."
                      loadOptions={(input) => loadOrganizations(input, 4, selectedPdmId)}
                      value={formSchool.pcm ? { label: formSchool.pcm, value: formSchool.pcm } : null}
                      onChange={(selected: any) => {
                        setSelectedPcmId(selected ? selected.id : null);
                        setFormSchool({ ...formSchool, pcm: selected ? selected.value : "", prm: "" });
                      }}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      noOptionsMessage={({ inputValue }) => inputValue ? "Tidak ditemukan" : "Ketik untuk mencari..."}
                    />
                  </div>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>PRM (Ranting)</label>
                    <AsyncSelect
                      key={`prm-${selectedPcmId || 'all'}`}
                      cacheOptions
                      defaultOptions
                      placeholder="Ketik untuk mencari PRM..."
                      loadOptions={(input) => loadOrganizations(input, 5, selectedPcmId)}
                      value={formSchool.prm ? { label: formSchool.prm, value: formSchool.prm } : null}
                      onChange={(selected: any) =>
                        setFormSchool({ ...formSchool, prm: selected ? selected.value : "" })
                      }
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isClearable
                      noOptionsMessage={({ inputValue }) => inputValue ? "Tidak ditemukan" : "Ketik untuk mencari..."}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Status</label>
                <select
                  value={formSchool.status}
                  onChange={(e) =>
                    setFormSchool({ ...formSchool, status: e.target.value })
                  }
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", width: "100%" }}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div className="modal-footer" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSchoolModalOpen(false);
                    clearForm();
                  }}
                  disabled={isSaving}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Batal
                </button>
                <ButtonPromax type="submit" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </ButtonPromax>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSchool && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setViewingSchool(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "24px", maxWidth: "500px", width: "100%" }}>
            <div className="modal-header" style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Detail Master Sekolah</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setViewingSchool(null)}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.95rem" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                {viewingSchool.logoUrl ? (
                  <img src={viewingSchool.logoUrl} alt="Logo Sekolah" style={{ maxHeight: "120px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} />
                ) : (
                  <div style={{ height: "120px", width: "120px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Belum ada logo
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>NPSN</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.npsn || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Nama Sekolah</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.nama || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Jenjang</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.jenjang || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Kota/Kabupaten</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.kabupaten || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Kecamatan</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.kecamatan || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Provinsi</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.provinsi || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Alamat</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.alamat || "-"}</strong></div>
              {viewingSchool.gmapUrl && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Google Map</span> <a href={viewingSchool.gmapUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}>Buka Peta</a></div>
              )}
              {(viewingSchool.lintang || viewingSchool.bujur) && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Koordinat</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.lintang || "-"} / {viewingSchool.bujur || "-"}</strong></div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Telepon</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.telepon || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Email</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.email || "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Website</span> <strong style={{ color: "var(--text-color)" }}>{viewingSchool.website ? <a href={viewingSchool.website} target="_blank" rel="noopener noreferrer">{viewingSchool.website}</a> : "-"}</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Organisasi</span> 
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem" }}>PWM: <strong>{viewingSchool.pwm || "-"}</strong></span>
                  <span style={{ fontSize: "0.85rem" }}>PDM: <strong>{viewingSchool.pdm || "-"}</strong></span>
                  <span style={{ fontSize: "0.85rem" }}>PCM: <strong>{viewingSchool.pcm || "-"}</strong></span>
                  <span style={{ fontSize: "0.85rem" }}>PRM: <strong>{viewingSchool.prm || "-"}</strong></span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}><span style={{ color: "var(--text-secondary)" }}>Status DB</span> <strong style={{ color: "var(--text-color)" }}>
                {viewingSchool.status === "Aktif" ? (
                  <span style={{ color: "var(--success-color, #22c55e)", background: "var(--success-bg, rgba(34, 197, 94, 0.1))", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>Aktif</span>
                ) : (
                  <span style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>{viewingSchool.status || "Tidak Aktif"}</span>
                )}
              </strong></div>
            </div>
            <div className="modal-footer" style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
              <ButtonPromax onClick={() => setViewingSchool(null)}>Tutup</ButtonPromax>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function RoleAccessSettings() {
  const { data, setData } = useAppData();
  const { session } = useAuth();

  const roleAccessPermissions = data.roleAccessPermissions || {};
  const [permissions, setPermissions] = useState<Record<string, string[]>>(
    roleAccessPermissions,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"access" | "deploy">("access");

  if (session?.role !== "superadmin") {
    return (
      <Page title="Akses Ditolak">
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </Page>
    );
  }

  const availableRoles = [
    "superadmin",
    "agen",
    "sekolah",
    "guru",
    "siswa",
    "uploader",
  ];
  const menuList = [
    { id: "dashboard", label: "Dasbor Utama" },
    { id: "users", label: "Kelola User" },
    { id: "catalog", label: "Master Katalog" },
    { id: "konten", label: "Menu Konten (Header)" },
    { id: "upload", label: "Upload Konten" },
    { id: "play", label: "Play Konten" },
    { id: "sales", label: "Data Penjualan" },
    { id: "sales-history", label: "Riwayat Penjualan" },
    { id: "subscriptions", label: "Langganan Sekolah" },
    { id: "payments", label: "Invoice & Pembayaran" },
    { id: "master-sekolah", label: "Master Sekolah" },
    { id: "sim-sekolah", label: "SIM Sekolah" },
    { id: "ai-settings", label: "Pengaturan AI" },
    { id: "inventory", label: "Inventaris KontenMu" },
    { id: "allocation", label: "Alokasi Akses Siswa" },
    { id: "teacher-allocation", label: "Alokasi Akses Guru" },
    { id: "school-users", label: "Users Sekolah" },
    { id: "profile", label: "Profil Pengguna" },
    { id: "school-profile", label: "Profil Sekolah" },
    { id: "library", label: "Player Konten / Rak Buku" },
    { id: "learning", label: "Progress Belajar" },
    { id: "access-settings", label: "Pengaturan" },
  ];

  const handleToggle = (menuId: string, role: string) => {
    setPermissions((prev) => {
      const currentRoles = prev[menuId] || [];
      const hasRole = currentRoles.includes(role);
      let newRoles = [...currentRoles];
      if (hasRole) {
        newRoles = newRoles.filter((r) => r !== role);
      } else {
        newRoles.push(role);
      }
      return { ...prev, [menuId]: newRoles };
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await setData((prev) => ({
        ...prev,
        roleAccessPermissions: permissions,
      }));
      alert("Berhasil menyimpan pengaturan akses.");
    } catch (err) {
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  const isProduction =
    window.location.hostname === "kontenmu.id" ||
    window.location.hostname === "www.kontenmu.id";

  return (
    <Page title="Pengaturan" subtitle="Pengaturan sistem dan integrasi">
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={() => setActiveTab("access")}
          style={{
            background: "none",
            border: "none",
            padding: "8px 16px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            color:
              activeTab === "access"
                ? "var(--primary)"
                : "var(--text-secondary)",
            borderBottom:
              activeTab === "access"
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            marginBottom: "-13px",
          }}
        >
          Akses User
        </button>
        {!isProduction && (
          <button
            onClick={() => setActiveTab("deploy")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 16px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              color:
                activeTab === "deploy"
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              borderBottom:
                activeTab === "deploy"
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              marginBottom: "-13px",
            }}
          >
            Push & Setup
          </button>
        )}
      </div>

      {activeTab === "access" && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
              Pengaturan Hak Akses User
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Atur menu yang dapat diakses oleh masing-masing tipe pengguna
            </p>
          </div>
          <div style={{ overflowX: "auto", marginBottom: "24px" }}>
            <table className="promax-table" style={{ minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Nama Menu</th>
                  {availableRoles.map((role) => (
                    <th
                      key={role}
                      style={{
                        textAlign: "center",
                        textTransform: "capitalize",
                      }}
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuList.map((menu) => (
                  <tr key={menu.id}>
                    <td style={{ fontWeight: 600 }}>
                      {menu.label}{" "}
                      <div
                        style={{
                          fontSize: "0.8em",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ID: {menu.id}
                      </div>
                    </td>
                    {availableRoles.map((role) => {
                      const isChecked = (permissions[menu.id] || []).includes(
                        role,
                      );
                      return (
                        <td key={role} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(menu.id, role)}
                            disabled={
                              role === "superadmin" &&
                              menu.id === "access-settings"
                            }
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <ButtonPromax onClick={saveSettings} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </ButtonPromax>
          </div>
        </>
      )}

      {!isProduction && activeTab === "deploy" && <DeploymentManager />}
    </Page>
  );
}
