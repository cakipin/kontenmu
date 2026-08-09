import { decode, verify } from "@tsndr/cloudflare-worker-jwt";

const AUTH_VERIFY_URL = "https://kontenmu-prod-api.1912.workers.dev/api/auth/verify";

async function isTokenValid(token: string, env: any) {
  try {
    if (env.JWT_SECRET && (await verify(token, env.JWT_SECRET))) return true;
  } catch {
    // Preview may have a different or unavailable secret; verify with issuer.
  }
  try {
    const response = await fetch(AUTH_VERIFY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const onRequest = async (context: any) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Bypass auth for the SSO token exchange endpoint, media routes, and public landing page data
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/media/")
  ) {
    return next();
  }
  if (
    (url.pathname === "/api/puck-data" ||
      url.pathname.startsWith("/api/schools") ||
      url.pathname === "/api/app-data" ||
      url.pathname === "/api/contents") &&
    request.method === "GET"
  ) {
    return next();
  }
  // Allow OPTIONS preflight requests to pass through
  if (request.method === "OPTIONS") {
    return next();
  }

  let isAuthenticated = false;
  let authRole = "";
  const authHeader = request.headers.get("Authorization") || "";
  const cookieHeader = request.headers.get("Cookie") || "";
  const authCookie = cookieHeader
    .split(";")
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith("__Host-kontenmu_auth=") || part.startsWith("kontenmu_auth="));
  const cookieToken = authCookie ? authCookie.slice(authCookie.indexOf("=") + 1) : "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : cookieToken;
  if (token) {
    const valid = await isTokenValid(token, context.env);
    isAuthenticated = !!valid;
    if (valid) authRole = String(decode(token).payload.role || "");
  }

  if (!isAuthenticated) {
    return new Response(
      JSON.stringify({ 
        error: "Unauthorized: Session is invalid or missing",
        debug: {
          hasToken: !!token,
          hasSecret: !!context.env.JWT_SECRET,
          tokenStart: token ? token.substring(0, 10) : null,
          cookieHeader: !!cookieHeader,
          authHeader: !!authHeader
        }
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const allowed = (...roles: string[]) => roles.includes(authRole);
  const isMutation = request.method !== "GET";
  const isSchoolProfileCompletion =
    request.method === "PUT" && /^\/api\/schools\/[^/]+$/.test(url.pathname);
  if (
    isMutation &&
    url.pathname.startsWith("/api/schools") &&
    !allowed("superadmin", "agen") &&
    !(isSchoolProfileCompletion && allowed("sekolah"))
  ) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  if (isMutation && (url.pathname.startsWith("/api/contents") || url.pathname.startsWith("/api/upload")) && !allowed("superadmin", "uploader")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  if (isMutation && url.pathname === "/api/puck-data" && !allowed("superadmin")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  return next();
};
