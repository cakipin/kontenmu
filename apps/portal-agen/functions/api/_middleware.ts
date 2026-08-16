import { decode, verify } from "@tsndr/cloudflare-worker-jwt";

const AUTH_VERIFY_URL = "https://kontenmu-prod-api.1912.workers.dev/api/auth/verify";
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const ACTIVE_ROLES = [
  "superadmin",
  "agen",
  "sekolah",
  "guru",
  "siswa",
  "uploader",
] as const;

type Role = (typeof ACTIVE_ROLES)[number] | "pending";
type RoutePolicy = {
  methods: readonly string[];
  match: (pathname: string, url: URL) => boolean;
  roles: readonly Role[] | "public";
};

const exact = (expected: string) => (pathname: string) => pathname === expected;
const pattern = (expected: RegExp) => (pathname: string) => expected.test(pathname);

// Urutan penting: route yang lebih spesifik harus didefinisikan lebih dahulu.
const ROUTE_POLICIES: readonly RoutePolicy[] = [
  { methods: ["POST"], match: exact("/api/auth/sso"), roles: "public" },
  { methods: ["POST"], match: exact("/api/auth/refresh"), roles: [...ACTIVE_ROLES, "pending"] },
  { methods: ["POST", "DELETE"], match: exact("/api/auth/session"), roles: "public" },
  { methods: ["GET"], match: exact("/api/puck-data"), roles: "public" },
  { methods: ["POST"], match: exact("/api/puck-data"), roles: ["superadmin"] },
  {
    methods: ["GET"],
    match: (pathname, url) => pathname === "/api/app-data" && url.searchParams.get("lite") === "true",
    roles: "public",
  },
  { methods: ["GET"], match: exact("/api/app-data"), roles: ACTIVE_ROLES },
  { methods: ["PUT"], match: exact("/api/app-data"), roles: ACTIVE_ROLES },
  { methods: ["GET"], match: exact("/api/schools"), roles: "public" },
  { methods: ["POST"], match: exact("/api/schools"), roles: ["superadmin", "agen"] },
  { methods: ["PUT"], match: pattern(/^\/api\/schools\/[^/]+$/), roles: ["superadmin", "agen", "sekolah"] },
  { methods: ["DELETE"], match: pattern(/^\/api\/schools\/[^/]+$/), roles: ["superadmin"] },
  { methods: ["POST"], match: pattern(/^\/api\/school-logo\/[^/]+$/), roles: ["sekolah"] },
  { methods: ["GET"], match: exact("/api/contents"), roles: ACTIVE_ROLES },
  { methods: ["POST", "DELETE"], match: exact("/api/contents"), roles: ["superadmin", "uploader"] },
  { methods: ["GET"], match: pattern(/^\/api\/content-source\/[^/]+$/), roles: ACTIVE_ROLES },
  { methods: ["GET"], match: exact("/api/content-thumbnail"), roles: ACTIVE_ROLES },
  { methods: ["GET"], match: exact("/api/analytics-stats"), roles: ["superadmin", "sekolah"] },
  { methods: ["POST"], match: exact("/api/analytics"), roles: ACTIVE_ROLES },
  { methods: ["GET"], match: exact("/api/users"), roles: [...ACTIVE_ROLES, "pending"] },
  { methods: ["POST"], match: exact("/api/users"), roles: "public" },
  { methods: ["PUT"], match: pattern(/^\/api\/users\/[^/]+$/), roles: ["superadmin", "sekolah", "pending"] },
  { methods: ["DELETE"], match: pattern(/^\/api\/users\/[^/]+$/), roles: ["superadmin"] },
  { methods: ["POST"], match: exact("/api/upload"), roles: ["superadmin", "uploader"] },
  { methods: ["POST"], match: exact("/api/upload/presign"), roles: ["superadmin", "uploader"] },
  { methods: ["GET"], match: pattern(/^\/api\/media\/.+$/), roles: ACTIVE_ROLES },
  { methods: ["GET", "PATCH"], match: exact("/api/notifications"), roles: ["superadmin", "sekolah"] },
];

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: JSON_HEADERS,
  });
}

function findPolicy(method: string, pathname: string, url: URL) {
  return ROUTE_POLICIES.find(
    (policy) => policy.methods.includes(method) && policy.match(pathname, url),
  );
}

function hasKnownPath(pathname: string, url: URL) {
  return ROUTE_POLICIES.some((policy) => policy.match(pathname, url));
}

function readToken(request: Request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();

  const authCookie = (request.headers.get("Cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find(
      (part) =>
        part.startsWith("__Host-kontenmu_auth=") ||
        part.startsWith("kontenmu_auth="),
    );
  return authCookie ? authCookie.slice(authCookie.indexOf("=") + 1) : "";
}

async function isTokenValid(token: string, env: any) {
  try {
    if (env.JWT_SECRET && (await verify(token, env.JWT_SECRET))) return true;
  } catch {
    // Preview dapat memakai secret berbeda; verifikasi ke issuer utama.
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
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return next();

  const policy = findPolicy(method, url.pathname, url);
  if (!policy) {
    return hasKnownPath(url.pathname, url)
      ? jsonError(405, "Method Not Allowed")
      : jsonError(403, "Forbidden");
  }
  if (policy.roles === "public") return next();

  const token = readToken(request);
  if (!token || !(await isTokenValid(token, context.env))) {
    return jsonError(401, "Unauthorized");
  }

  let payload: any;
  try {
    payload = decode(token).payload;
  } catch {
    return jsonError(401, "Unauthorized");
  }

  const role = String(payload?.role || "") as Role;
  if (!policy.roles.includes(role)) return jsonError(403, "Forbidden");

  // Handler yang membutuhkan pengecekan kepemilikan menggunakan payload yang
  // telah diverifikasi ini, bukan melakukan decode cookie secara mandiri.
  context.data.auth = payload;
  return next();
};
