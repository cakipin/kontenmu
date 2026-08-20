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
      <div className="p-8 text-center text-gray-500">
        Akses ditolak. Halaman ini hanya untuk superadmin.
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-8 h-8 text-indigo-600" />
              AI System Monitor
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Memonitor error dan bug di sistem dengan analisis otomatis oleh Qwen AI
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daftar Error */}
          <div className="lg:col-span-1 flex flex-col gap-3 h-[600px] overflow-y-auto pr-2">
            {loading && logs.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Memuat data...</div>
            ) : logs.length === 0 ? (
              <div className="text-center text-gray-500 py-10 border rounded-lg border-dashed">
                Tidak ada error terekam. Sistem berjalan lancar!
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLog?.id === log.id
                      ? "bg-red-50 border-red-200"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {log.service}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {log.error_message}
                  </h3>
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span className="truncate max-w-[120px]">{log.endpoint}</span>
                    <span>{new Date(log.timestamp).toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short"
                    })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Analisis AI */}
          <div className="lg:col-span-2">
            {selectedLog ? (
              <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Detail Laporan</h2>
                  <p className="text-sm text-gray-500">ID: {selectedLog.id}</p>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-gray-700" />
                      Pesan Error
                    </h3>
                    <div className="bg-red-50 text-red-700 p-3 rounded-md font-mono text-sm break-all">
                      {selectedLog.error_message}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      Analisis AI (Qwen 1.5)
                    </h3>
                    <div className="bg-indigo-50 text-indigo-900 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border border-indigo-100">
                      {selectedLog.ai_analysis}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Stack Trace Asli</h3>
                    <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap leading-relaxed">
                      {selectedLog.stack_trace || "Tidak ada stack trace"}
                    </pre>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed rounded-xl h-[600px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Pilih log di samping untuk melihat analisis AI</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
