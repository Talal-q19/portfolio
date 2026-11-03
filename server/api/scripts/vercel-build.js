const { spawnSync } = require('node:child_process');
// Only the backend project owns schema/function releases.
if (!process.env.CONVEX_DEPLOY_KEY) throw new Error('Configure a deployment-scoped CONVEX_DEPLOY_KEY for this environment.');
const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(executable, ['convex', 'deploy', '--yes'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) throw result.error;
process.exitCode = result.status || 0;
