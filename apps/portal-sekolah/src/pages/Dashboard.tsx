import { useEffect, useState } from 'react';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';
import { Chip } from '../../../../packages/ui/src/Chip';
import { api, type InventoryItem } from '@repo/api';

export default function Dashboard({ sekolahId }: { sekolahId: number }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInventory(sekolahId)
      .then(setInventory)
      .finally(() => setLoading(false));
  }, [sekolahId]);

  const totalLisensi = inventory.reduce((sum, item) => sum + item.total_lisensi, 0);
  const totalTeralokasi = inventory.reduce((sum, item) => sum + item.teralokasi, 0);
  const sisa = totalLisensi - totalTeralokasi;

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <div className="dashboard-grid">
        <MetricCard icon="📦" color="#4f46e5" title="Total Lisensi" value={String(totalLisensi)} subtitle="Dari agen wilayah" />
        <MetricCard icon="👥" color="#10b981" title="Teralokasi" value={String(totalTeralokasi)} subtitle="Ke siswa aktif" />
        <MetricCard icon="📖" color="#0ea5e9" title="Sisa Kuota" value={String(sisa)} subtitle="Belum dialokasikan" />
      </div>

      <GlassCard style={{ width: '100%', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Ringkasan Inventaris</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
          Status lisensi buku di sekolah Anda.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Memuat data...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-promax">
              <thead>
                <tr>
                  <th>Judul Buku</th>
                  <th>ISBN</th>
                  <th>Total</th>
                  <th>Teralokasi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const sisaItem = item.total_lisensi - item.teralokasi;
                  return (
                    <tr key={item.isbn}>
                      <td>{item.judul}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.isbn}</td>
                      <td>{item.total_lisensi}</td>
                      <td>{item.teralokasi}</td>
                      <td>
                        <Chip
                          type={sisaItem > 0 ? 'success' : 'warning'}
                          label={sisaItem > 0 ? `${sisaItem} tersedia` : 'Penuh'}
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
    </div>
  );
}

function MetricCard({ icon, color, title, value, subtitle }: {
  icon: string; color: string; title: string; value: string; subtitle: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon-wrapper" style={{ color }}>{icon}</div>
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
