import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
export async function proxyApi(request, env = process.env, fetchImpl = fetch) {
  const incoming = new URL(request.url);
  if (!/^\/api\/(?:content|contact|health|admin(?:\/.*)?)$/.test(incoming.pathname)) return Response.json({ message: 'Not found.' }, { status: 404 });
  const secret = env.API_PROXY_SECRET;
  if (env.NODE_ENV === 'production' && (!secret || secret.length < 32 || !env.API_INTERNAL_URL)) return Response.json({ message: 'API proxy is not configured.' }, { status: 503 });
  const target = new URL(env.API_INTERNAL_URL || 'http://127.0.0.1:4000');
  target.pathname = incoming.pathname; target.search = incoming.search;
  const headers = new Headers();
  for (const key of ['cookie', 'origin', 'content-type', 'x-admin-request']) {
    const value = request.headers.get(key); if (value) headers.set(key, value);
  }
  if (secret) {
    // Vercel overwrites this header at the frontend edge. Never accept a
    // caller-supplied forwarding header in ordinary local development.
    const ip = env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() : '127.0.0.1';
    if (!ip || !isIP(ip)) return Response.json({ message: 'Client address unavailable.' }, { status: 503 });
    const timestamp = String(Date.now());
    headers.set('x-portfolio-ip', ip); headers.set('x-portfolio-time', timestamp);
    headers.set('x-portfolio-signature', createHmac('sha256', secret).update(`${timestamp}\n${ip}\n${request.method}\n${target.pathname}${target.search}`).digest('hex'));
  }
  try {
    const response = await fetchImpl(target, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const output = new Headers({ 'Cache-Control': 'no-store' });
    for (const key of ['content-type', 'retry-after']) { const value = response.headers.get(key); if (value) output.set(key, value); }
    for (const cookie of response.headers.getSetCookie()) output.append('set-cookie', cookie);
    return new Response(response.body, { status: response.status, headers: output });
  } catch { return Response.json({ success: false, message: 'API unavailable. Please retry.' }, { status: 503 }); }
}
