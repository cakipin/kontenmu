import { useEffect, useState } from "react";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { Chip } from "../../../../packages/ui/src/Chip";
import { api, type InventoryItem } from "@repo/api";

export default function Inventory({ sekolahId }: { sekolahId: number }) {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getInventory(sekolahId)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat inventaris",
        ),
      )
      .finally(() => setLoading(false));
  }, [sekolahId]);

  return (
    <GlassCard style={{ width: "100%", maxWidth: "1000px" }}>
      <h2 style={{ marginBottom: "8px" }}>Inventaris KontenMu</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Brankas lisensi buku yang telah dibeli dari agen wilayah.
      </p>

      {loading && (
        <p style={{ color: "var(--text-secondary)" }}>Memuat data...</p>
      )}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table className="table-promax">
            <thead>
              <tr>
                <th>Judul Buku</th>
                <th>ISBN</th>
                <th>Total Lisensi</th>
                <th>Teralokasi</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const sisa = item.total_lisensi - item.teralokasi;
                return (
                  <tr key={item.isbn}>
                    <td style={{ fontWeight: 500 }}>{item.judul}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {item.isbn}
                    </td>
                    <td>{item.total_lisensi}</td>
                    <td>{item.teralokasi}</td>
                    <td style={{ fontWeight: 600 }}>{sisa}</td>
                    <td>
                      <Chip
                        type={sisa > 0 ? "success" : "warning"}
                        label={sisa > 0 ? "Tersedia" : "Habis"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
