import { Link } from "react-router-dom";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        background:
          "radial-gradient(circle at 50% -20%, #1a365d 0%, #0f172a 50%, #020617 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <GlassCard
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "48px 40px",
          textAlign: "center",
          background: "rgba(30, 41, 59, 0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "5rem",
              fontWeight: 900,
              color: "#38bdf8",
              margin: 0,
              lineHeight: 1,
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "white",
              margin: "16px 0 8px 0",
            }}
          >
            Halaman Tidak Ditemukan
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Maaf, halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>

        <Link to="/" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "1.05rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              width: "100%",
            }}
          >
            Kembali ke Beranda
          </button>
        </Link>
      </GlassCard>
    </div>
  );
}
