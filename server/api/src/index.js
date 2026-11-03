const { readConfig } = require('./config/env');
const { createApp } = require('./create-app');
const express = require('express');
let initializing;
async function application() {
  if (!initializing) initializing = (async () => {
    const config = readConfig();
    const runtime = await require('./services/auth-runtime').authRuntime(config);
    return createApp(config, { auth: runtime.auth, store: runtime.store });
  })().catch(error => { initializing = undefined; throw error; });
  return initializing;
}
// Export a real Express application so Vercel's framework detector and runtime
// agree on the entrypoint. Initialize its authenticated router on first use.
const entry = express();
entry.disable('x-powered-by');
entry.use(async (req, res) => {
  try { (await application())(req, res); }
  catch { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: false, message: 'API initialization failed.' })); }
});
module.exports = entry;
if (require.main === module && !process.env.VERCEL) {
  application().then(app => {
    const config = readConfig();
    const server = app.listen(config.port, config.host, () => console.log(`Portfolio API listening on port ${config.port}`));
    for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close());
  }).catch(() => { console.error('API startup failed. Check Convex and authentication configuration.'); process.exitCode = 1; });
}
