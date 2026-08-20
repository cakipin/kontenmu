import { useEffect, useState } from "react";
import { AlertTriangle, Terminal, Bot, RefreshCw } from "lucide-react";
import { useAuth } from "@repo/auth";

export default function AiSystemMonitor() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/error-logs", {
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role === "superadmin") {
      fetchLogs();
    }
  }, [session]);

  if (session?.role !== "superadmin") {
    return (
      <div className="page-shell">
        <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
          Akses ditolak. Halaman ini hanya untuk superadmin.
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Bot size={28} color="#4f46e5" />
            AI System Monitor
          </h1>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b" }}>
            Memonitor error dan bug di sistem dengan analisis otomatis oleh Qwen AI
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#334155",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            opacity: loading ? 0.7 : 1
          }}
        >
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Kolom Kiri: Daftar Log */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            height: "calc(100vh - 200px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>Memuat data...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
              Tidak ada error terekam. Sistem aman!
            </div>
          ) : (
            logs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: `1px solid \${isSelected ? '#fecaca' : '#f1f5f9'}`,
                    background: isSelected ? '#fef2f2' : '#ffffff',
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {log.service}
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", fontWeight: 500, color: "#1e293b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {log.error_message}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                      {log.endpoint}
                    </span>
                    <span>
                      {new Date(log.timestamp).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kolom Kanan: Detail & AI Analysis */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            height: "calc(100vh - 200px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {selectedLog ? (
            <>
              <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "1.125rem", fontWeight: 600, color: "#0f172a" }}>
                  Detail Laporan Error
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>ID: {selectedLog.id}</p>
              </div>
              
              <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Terminal size={18} color="#475569" />
                    Pesan Error Asli
                  </h3>
                  <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "16px", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all", border: "1px solid #fee2e2" }}>
                    {selectedLog.error_message}
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bot size={18} color="#4f46e5" />
                    Analisis & Rekomendasi AI
                  </h3>
                  <div style={{ background: "#eef2ff", color: "#312e81", padding: "20px", borderRadius: "12px", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap", border: "1px solid #e0e7ff" }}>
                    {selectedLog.ai_analysis}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    Stack Trace
                  </h3>
                  <pre style={{ background: "#0f172a", color: "#cbd5e1", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "0.8rem", whiteSpace: "pre-wrap", lineHeight: 1.5, margin: 0 }}>
                    {selectedLog.stack_trace || "Tidak ada stack trace yang terekam."}
                  </pre>
                </div>

              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
              <Bot size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <p style={{ margin: 0 }}>Pilih log di sebelah kiri untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
