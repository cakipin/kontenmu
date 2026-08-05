import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { ButtonPromax } from "../../../../packages/ui/src/ButtonPromax";
import { api, type Alokasi, type InventoryItem } from "@repo/api";

export default function Allocation({ sekolahId }: { sekolahId: number }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allocations, setAllocations] = useState<Alokasi[]>([]);
  const [siswaId, setSiswaId] = useState("");
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = () => {
    return Promise.all([
      api.getInventory(sekolahId),
      api.getAllocations(sekolahId),
    ]).then(([inv, alloc]) => {
      setInventory(inv);
      setAllocations(alloc);
      if (!isbn && inv[0]) setIsbn(inv[0].isbn);
    });
  };

  useEffect(() => {
    loadData().catch((err) =>
      setError(err instanceof Error ? err.message : "Gagal memuat data"),
    );
  }, [sekolahId]);

  const availableBooks = inventory.filter(
    (item) => item.total_lisensi > item.teralokasi,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await api.allocate({ sekolahId, isbn, siswaId });
      setMessage(`${result.message} (Sisa kuota: ${result.remaining})`);
      setSiswaId("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengalokasikan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "1000px",
      }}
    >
      <GlassCard>
        <h2 style={{ marginBottom: "8px" }}>Alokasi Akses Siswa</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          Bagikan lisensi buku ke siswa. Sistem akan memvalidasi kuota tersedia.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "480px",
          }}
        >
          <label
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              ID / NISN Siswa
            </span>
            <input
              type="text"
              value={siswaId}
              onChange={(e) => setSiswaId(e.target.value)}
              placeholder="Contoh: 0012345681"
              required
              style={inputStyle}
            />
          </label>

          <label
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              Buku
            </span>
            <select
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              required
              style={inputStyle}
            >
              {availableBooks.length === 0 ? (
                <option value="">Tidak ada kuota tersedia</option>
              ) : (
                availableBooks.map((b) => (
                  <option key={b.isbn} value={b.isbn}>
                    {b.judul} (sisa: {b.total_lisensi - b.teralokasi})
                  </option>
                ))
              )}
            </select>
          </label>

          {message && (
            <p style={{ color: "var(--success)", fontSize: "0.875rem" }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>
              {error}
            </p>
          )}

          <ButtonPromax
            type="submit"
            disabled={loading || availableBooks.length === 0}
          >
            {loading ? "Memproses..." : "Alokasikan Lisensi"}
          </ButtonPromax>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 style={{ marginBottom: "16px" }}>Riwayat Alokasi</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table-promax">
            <thead>
              <tr>
                <th>Siswa ID</th>
                <th>Buku</th>
                <th>ISBN</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      color: "var(--text-secondary)",
                      padding: "24px",
                    }}
                  >
                    Belum ada alokasi.
                  </td>
                </tr>
              ) : (
                allocations.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.siswa_id}</td>
                    <td>{row.judul}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {row.isbn}
                    </td>
                    <td>
                      {new Date(row.tanggal_alokasi).toLocaleDateString(
                        "id-ID",
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid var(--glass-border)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  outline: "none",
};
