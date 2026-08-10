import { verify } from "@tsndr/cloudflare-worker-jwt";

const jsonHeaders = { "Content-Type": "application/json" };
const MAX_AGE_SECONDS = 24 * 60 * 60;
// Default to production verify URL if not specified in env
const DEFAULT_AUTH_VERIFY_URL = "https://kontenmu-prod-api.1912.workers.dev/api/auth/verify";

async function isTokenValid(token: string, env: any, requestUrl: string) {
  try {
    if (env.JWT_SECRET && (await verify(token, env.JWT_SECRET))) return true;
  } catch {
    // Preview may have a different or unavailable secret; verify with issuer.
  }
  
  const isStaging = new URL(requestUrl).hostname.includes("staging") || new URL(requestUrl).hostname.includes("localhost");
  const verifyUrl = env.VITE_API_URL ? `${env.VITE_API_URL}/api/auth/verify` : (env.AUTH_VERIFY_URL || (isStaging ? "https://sales-api.1912.workers.dev/api/auth/verify" : DEFAULT_AUTH_VERIFY_URL));
  
  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function cookieName(request: Request) {
  return new URL(request.url).hostname.includes("localhost")
    ? "kontenmu_auth"
    : "__Host-kontenmu_auth";
}

export const onRequestPost = async (context: any) => {
  const authHeader = context.request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || !(await isTokenValid(token, context.env, context.request.url))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const secure = new URL(context.request.url).protocol === "https:" ? "; Secure" : "";
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...jsonHeaders,
      "Set-Cookie": `${cookieName(context.request)}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`,
      "Cache-Control": "no-store",
    },
  });
};

export const onRequestDelete = async (context: any) => {
  const secure = new URL(context.request.url).protocol === "https:" ? "; Secure" : "";
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...jsonHeaders,
      "Set-Cookie": `${cookieName(context.request)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
      "Cache-Control": "no-store",
    },
  });
};
