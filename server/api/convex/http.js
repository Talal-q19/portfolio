import { httpRouter, httpActionGeneric, makeFunctionReference } from 'convex/server';
const http = httpRouter();
export const bridgeHandler = httpActionGeneric(async (ctx, request) => {
  const secret = process.env.CONVEX_SERVICE_SECRET;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers });
  if (!secret || secret.length < 32 || request.headers.get('Authorization') !== `Bearer ${secret}`) return json({ message: 'Unauthorized.' }, 401);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ message: 'Use JSON.' }, 415);
  let input;
  try { input = JSON.parse(await request.text()); } catch { return json({ message: 'Invalid JSON.' }, 400); }
  if (!input || typeof input.operation !== 'string' || !input.args || typeof input.args !== 'object') return json({ message: 'Invalid request.' }, 400);
  if (input.operation.startsWith('migration') && process.env.CONVEX_MIGRATION_ENABLED !== 'true') return json({ message: 'Migration is disabled.' }, 403);
  try {
    if (input.operation === 'content' && input.args.path === 'admin/media/complete-upload') return json(await ctx.runAction(makeFunctionReference('uploads:complete'), input.args));
    return json(await ctx.runMutation(makeFunctionReference('bridge:execute'), input));
  }
  catch (error) {
    const data = error.data;
    return json(data && typeof data === 'object' ? data : { message: 'Data operation failed.' }, data?.status || 500);
  }
});
http.route({ path: '/bridge', method: 'POST', handler: bridgeHandler });
export default http;
