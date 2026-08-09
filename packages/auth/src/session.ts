export type UserRole =
  "superadmin" | "agen" | "sekolah" | "guru" | "siswa" | "uploader" | "pending";

export type AppId = "portal-agen" | "portal-sekolah";

export interface Session {
  id?: string;
  username: string;
  role: UserRole;
  displayName: string;
  initial: string;
  sekolahId?: number;
  wilayah?: string;
  nbm?: string;
  picture?: string;
  loginAt: number;
  expiresAt: number;
  isSso?: boolean;
  token?: string;
}

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const SESSION_COOKIE_PREFIX = "kontenmu_session";

function tokenStorageKey(appId: AppId) {
  return `${cookieKey(appId)}_token`;
}

function cookieKey(appId: AppId) {
  return `${SESSION_COOKIE_PREFIX}_${appId.replace("-", "_")}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split("; ")
    .find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

export function isSessionValid(session: Session | null): session is Session {
  if (!session) return false;
  return Date.now() < session.expiresAt;
}

export function getSession(appId: AppId): Session | null {
  try {
    const raw = readCookie(cookieKey(appId));
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    const legacyToken = session.token;
    if (typeof window !== "undefined") {
      session.token = sessionStorage.getItem(tokenStorageKey(appId)) || legacyToken || undefined;
      if (legacyToken) {
        sessionStorage.setItem(tokenStorageKey(appId), legacyToken);
        const { token: _token, ...sanitizedSession } = session;
        const secureFlag = window.location.hostname.includes("localhost") ? "" : "; Secure";
        document.cookie = `${encodeURIComponent(cookieKey(appId))}=${encodeURIComponent(JSON.stringify(sanitizedSession))}; Path=/; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}; SameSite=Lax${secureFlag}`;
      }
    }
    if (!isSessionValid(session)) {
      clearSession(appId);
      return null;
    }

    if (typeof document !== "undefined") {
      const storedPicture = localStorage.getItem(`${cookieKey(appId)}_picture`);
      if (storedPicture) {
        session.picture = storedPicture;
      }
    }

    return session;
  } catch {
    clearSession(appId);
    return null;
  }
}

export function saveSession(appId: AppId, session: Session) {
  if (typeof document === "undefined") return;
  const isSecure =
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost");
  const secureFlag = isSecure ? "; Secure" : "";

  // Omit large fields like picture to prevent cookie size limit issues
  const { picture, token, ...sessionToSave } = session;

  if (token) sessionStorage.setItem(tokenStorageKey(appId), token);
  else sessionStorage.removeItem(tokenStorageKey(appId));

  if (picture) {
    localStorage.setItem(`${cookieKey(appId)}_picture`, picture);
  } else {
    localStorage.removeItem(`${cookieKey(appId)}_picture`);
  }

  document.cookie = `${encodeURIComponent(cookieKey(appId))}=${encodeURIComponent(JSON.stringify(sessionToSave))}; Path=/; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}; SameSite=Lax${secureFlag}`;
}

export function clearSession(appId: AppId) {
  if (typeof document === "undefined") return;
  localStorage.removeItem(`${cookieKey(appId)}_picture`);
  sessionStorage.removeItem(tokenStorageKey(appId));
  document.cookie = `${encodeURIComponent(cookieKey(appId))}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getSessionTimeLeft(session: Session): string {
  const ms = session.expiresAt - Date.now();
  if (ms <= 0) return "Kedaluwarsa";

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes} menit`;
}

let authenticatedFetchInstalled = false;

export function installAuthenticatedFetch(appId: AppId) {
  if (typeof window === "undefined" || authenticatedFetchInstalled) return;
  authenticatedFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const rawUrl = input instanceof Request ? input.url : input.toString();
    const target = new URL(rawUrl, window.location.origin);
    const isKontenmuApi =
      target.pathname.startsWith("/api/") &&
      (target.origin === window.location.origin ||
        target.hostname === "sales-api.1912.workers.dev" ||
        target.hostname === "kontenmu-prod-api.1912.workers.dev");

    const token = getSession(appId)?.token;
    if (!isKontenmuApi || !token) return originalFetch(input, init);

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    headers.set("Authorization", `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  };
}
