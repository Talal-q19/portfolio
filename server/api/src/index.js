const { readConfig } = require('./config/env');
const { createApp } = require('./app');

async function main() {
  const config = readConfig();
  const runtime = await require('./services/auth-runtime').authRuntime(config);
  const server = createApp(config, { auth: runtime.auth }).listen(config.port, config.host, () => {
    console.log(`Portfolio API listening on port ${config.port}`);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => server.close(async () => { await runtime.close(); process.exit(0); }));
  }
}
main().catch(error => { console.error(error.code ? `API startup failed (${error.code}). Check database/Redis configuration and migrations.` : error.message); process.exitCode = 1; });
