const { readConfig } = require('./config/env');
const { createApp } = require('./app');

const config = readConfig();
const server = createApp(config).listen(config.port, '0.0.0.0', () => {
  console.log(`Portfolio API listening on port ${config.port}`);
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
