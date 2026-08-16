import { useEffect, useState } from "react";
import { TrendingUp, Monitor } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "var(--text-primary)" }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ margin: 0, color: entry.color, display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color,
              }}
            />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
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

  const visitsChart = analyticsStats?.visitsChart || [];
  const deviceChart = analyticsStats?.deviceChart || [];
  const topPaths = analyticsStats?.topPaths || [];

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
            Pantau aktivitas pengguna dan kunjungan lalu lintas web menggunakan grafik interaktif.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
            Memuat data analitik...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "24px",
              paddingBottom: "24px",
            }}
          >
            {/* Charts Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {/* Line Chart */}
              <div
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h3 style={{ margin: "0 0 24px 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={20} color="#8B5CF6" />
                  Tren Kunjungan (7 Hari)
                </h3>
                <div style={{ height: "300px", width: "100%" }}>
                  {visitsChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitsChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--text-secondary)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="visits"
                          name="Kunjungan"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "var(--bg-card)" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                      Belum ada data kunjungan.
                    </div>
                  )}
                </div>
              </div>

              {/* Pie Chart */}
              <div
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h3 style={{ margin: "0 0 24px 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Monitor size={20} color="#EC4899" />
                  Distribusi Perangkat
                </h3>
                <div style={{ height: "300px", width: "100%", position: "relative" }}>
                  {deviceChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="visits"
                          nameKey="deviceType"
                          stroke="none"
                        >
                          {deviceChart.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                      Belum ada data perangkat.
                    </div>
                  )}
                  {deviceChart.length > 0 && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "block" }}>Total</span>
                      <strong style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>
                        {deviceChart.reduce((acc: number, curr: any) => acc + curr.visits, 0)}
                      </strong>
                    </div>
                  )}
                </div>
                {/* Custom Legend */}
                {deviceChart.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
                    {deviceChart.map((entry: any, index: number) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[index % COLORS.length] }} />
                        <span style={{ textTransform: "capitalize" }}>{entry.deviceType}</span>
                        <strong style={{ color: "var(--text-primary)" }}>({entry.visits})</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top 10 Content Row */}
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid var(--border-color)",
              }}
            >
              <h3 style={{ margin: "0 0 24px 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={20} color="#10B981" />
                10 Konten Paling Banyak Dikunjungi
              </h3>
              
              {topPaths.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topPaths.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: index < 3 ? "var(--accent-primary)" : "var(--border-color)",
                            color: index < 3 ? "#fff" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-word" }}>
                            {item.path}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Judul konten
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {formatNumber(item.visits)} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>kunjungan</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                  Belum ada data kunjungan yang tercatat.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
