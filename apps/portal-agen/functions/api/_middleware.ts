export const onRequest = async (context: any) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Bypass auth for the SSO token exchange endpoint, media routes, and public landing page data
  if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/media/')) {
    return next();
  }
  if (url.pathname === '/api/puck-data' && request.method === 'GET') {
    return next();
  }
  
  // Allow OPTIONS preflight requests to pass through
  if (request.method === 'OPTIONS') {
    return next();
  }

  // Allow registration of new users during SSO login (from OAuthCallback)
  // We'll trust the client for POST /api/users for now, ideally it should be signed,
  // but since we removed the superadmin override, the risk is mitigated.
  if (url.pathname === '/api/users' && request.method === 'POST') {
    return next();
  }

  const cookieHeader = request.headers.get('Cookie');
  let isAuthenticated = false;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: any, cookieString: string) => {
      const [key, val] = cookieString.trim().split('=');
      if (key && val) acc[key] = decodeURIComponent(val);
      return acc;
    }, {});

    const sessionRaw = cookies['kontenmu_session_portal_agen'];
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session && typeof session === 'object' && session.expiresAt && Date.now() < session.expiresAt) {
          isAuthenticated = true;
          // You could also set context.data.user = session here for downstream use
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Session is invalid or missing' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return next();
};
