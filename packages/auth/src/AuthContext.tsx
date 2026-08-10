import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getSession,
  getSessionTimeLeft,
  saveSession,
  type AppId,
  type Session,
  type UserRole,
} from "./session";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setCustomSession: (session: Omit<Session, "expiresAt">) => void;
  sessionTimeLeft: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  appId: AppId;
  allowedRoles?: UserRole[];
  children: ReactNode;
}

export function AuthProvider({
  appId,
  allowedRoles,
  children,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(() =>
    getSession(appId),
  );
  const [isLoading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      sessionTimeLeft: session ? getSessionTimeLeft(session) : null,
      login: async (username, password) => {
        try {
          const apiUrl = import.meta.env.DEV
            ? ""
            : import.meta.env.VITE_API_URL ||
              "https://sales-api.1912.workers.dev";
          const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim(), password }),
            cache: "no-store",
          });

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
             return "Terjadi kesalahan pada server API. Format respons tidak valid.";
          }

          const json = await res.json();
          if (json.success && json.user && json.token) {
            const user = json.user;
            if (user) {
              if (user.status !== "Aktif")
                return "Akun belum aktif atau menunggu approval";
              if (allowedRoles && !allowedRoles.includes(user.role))
                return "Akses ditolak untuk role ini";

              const sessionResponse = await fetch("/api/auth/session", {
                method: "POST",
                headers: { Authorization: `Bearer ${json.token}` },
              });
              if (!sessionResponse.ok) return "Gagal membuat sesi aman.";

              const now = Date.now();
              const nextSession = {
                id: user.id,
                username: user.username,
                role: user.role,
                displayName: user.nama,
                initial: (user.nama || user.username)
                  .substring(0, 2)
                  .toUpperCase(),
                sekolahId: user.sekolah_id
                  ? parseInt(user.sekolah_id)
                  : undefined,
                wilayah: user.wilayah || undefined,
                picture: user.picture || undefined,
                loginAt: now,
                expiresAt: now + 24 * 60 * 60 * 1000,
                isSso: !!user.sso_id,
                token: json.token,
              };

              saveSession(appId, nextSession as any);
              setSession(nextSession as any);
              return null;
            }
          } else if (json.error) {
            return json.error;
          }
        } catch (e) {
          console.error("Login fetch error:", e);
          return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
        }

        return "Username atau password salah.";
      },
      logout: () => {
        void fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
        clearSession(appId);
        setSession(null);
      },
      switchRole: (role: UserRole) => {
        alert(
          `Simulasi role ${role} dinonaktifkan. Silakan login dengan akun asli.`,
        );
      },
      setCustomSession: (customSession: Omit<Session, "expiresAt">) => {
        const nextSession = {
          ...customSession,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        saveSession(appId, nextSession as any);
        setSession(nextSession as any);
      },
    }),
    [appId, allowedRoles, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
