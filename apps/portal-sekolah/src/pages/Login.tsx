import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@repo/auth";
import { Eye, EyeOff } from "lucide-react";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { ButtonPromax } from "../../../../packages/ui/src/ButtonPromax";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const loginError = await login(username, password);
    if (loginError) {
      setError(`${loginError} (Hint: sekolah / 123)`);
    }

    setLoading(false);
  };

  const handleSsoRedirect = () => {
    setLoading(true);
    const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const authorizeUrl = `https://dias.muhammadiyah.or.id/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    window.location.href = authorizeUrl;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        background: "var(--bg-primary)",
      }}
    >
      <GlassCard style={{ width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏫</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Portal{" "}
            <span style={{ color: "var(--accent-primary)" }}>Sekolah</span>
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginTop: "8px",
            }}
          >
            Sesi tersimpan selama 24 jam
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="sekolah"
              autoComplete="username"
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
              Password
            </span>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123"
                autoComplete="current-password"
                style={{
                  ...inputStyle,
                  width: "100%",
                  paddingRight: "44px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          {error && (
            <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>
              {error}
            </p>
          )}

          <ButtonPromax type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </ButtonPromax>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
          }}
        >
          <div
            style={{ flex: 1, borderBottom: "1px solid var(--glass-border)" }}
          ></div>
          <span style={{ padding: "0 12px" }}>Atau masuk dengan</span>
          <div
            style={{ flex: 1, borderBottom: "1px solid var(--glass-border)" }}
          ></div>
        </div>

        <button
          onClick={handleSsoRedirect}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "12px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#1e293b",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            "Memproses..."
          ) : (
            <>
              <img
                src="/muhammadiyah-logo.png"
                alt="Muhammadiyah ID"
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
              Masuk dengan Muhammadiyah ID
            </>
          )}
        </button>
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
