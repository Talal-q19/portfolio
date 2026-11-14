const { spawnSync } = require('node:child_process');
const path = require('node:path');
// Only the backend project owns schema/function releases.
if (!process.env.CONVEX_DEPLOY_KEY) throw new Error('Configure a deployment-scoped CONVEX_DEPLOY_KEY for this environment.');
const result = spawnSync(process.execPath, [path.join(__dirname, 'convex.js'), 'deploy', '--yes'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status || 0;
