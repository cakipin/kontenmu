import { useEffect, useState } from "react";
import { Users, TrendingUp } from "lucide-react";
import { StatCard, MetricCard } from "./Dashboard";

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

export default function Analytics({ currentRole }: { currentRole: string }) {
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRole === "superadmin" || currentRole === "sekolah") {
      fetch("/api/analytics-stats")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setAnalyticsStats(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [currentRole]);

  if (currentRole !== "superadmin" && currentRole !== "sekolah") {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-content">
          <h2>Akses Ditolak</h2>
          <p>Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            Statistik Analitik
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Pantau aktivitas pengguna dan kunjungan lalu lintas web.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "24px", textAlign: "center" }}>Memuat data analitik...</div>
        ) : (
          <>
            {currentRole === "superadmin" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  paddingBottom: "12px",
                }}
              >
                <StatCard
                  icon={<Users size={20} />}
                  colorStart="#8B5CF6"
                  colorEnd="#7C3AED"
                  shadowColor="rgba(139, 92, 246, 0.2)"
                  title="User Aktif (24j)"
                  value={formatNumber(analyticsStats?.activeUsersToday || 0)}
                  subtitle="Login hari ini"
                />
                <StatCard
                  icon={<Users size={20} />}
                  colorStart="#6366F1"
                  colorEnd="#4F46E5"
                  shadowColor="rgba(99, 102, 241, 0.2)"
                  title="User Aktif (7h)"
                  value={formatNumber(analyticsStats?.activeUsersWeek || 0)}
                  subtitle="Login 7 hari terakhir"
                />
                <StatCard
                  icon={<TrendingUp size={20} />}
                  colorStart="#EC4899"
                  colorEnd="#DB2777"
                  shadowColor="rgba(236, 72, 153, 0.2)"
                  title="Kunjungan Web (24j)"
                  value={
                    analyticsStats?.isAnalyticsConfigured
                      ? formatNumber(analyticsStats?.visitsToday || 0)
                      : "N/A"
                  }
                  subtitle={
                    analyticsStats?.isAnalyticsConfigured
                      ? "Total traffic web"
                      : "Belum Dikonfigurasi"
                  }
                />
                <StatCard
                  icon={<TrendingUp size={20} />}
                  colorStart="#F43F5E"
                  colorEnd="#E11D48"
                  shadowColor="rgba(244, 63, 94, 0.2)"
                  title="Kunjungan Web (7h)"
                  value={
                    analyticsStats?.isAnalyticsConfigured
                      ? formatNumber(analyticsStats?.visitsWeek || 0)
                      : "N/A"
                  }
                  subtitle={
                    analyticsStats?.isAnalyticsConfigured
                      ? "7 hari terakhir"
                      : "Belum Dikonfigurasi"
                  }
                />
              </div>
            )}

            {currentRole === "sekolah" && (
              <div className="dashboard-grid">
                <MetricCard
                  icon={<Users size={24} />}
                  color="#8B5CF6"
                  title="Aktif Hari Ini"
                  value={formatNumber(analyticsStats?.activeUsersToday || 0)}
                  subtitle="Login 24 jam terakhir"
                />
                <MetricCard
                  icon={<Users size={24} />}
                  color="#6366F1"
                  title="Aktif 7 Hari"
                  value={formatNumber(analyticsStats?.activeUsersWeek || 0)}
                  subtitle="Login 7 hari terakhir"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
