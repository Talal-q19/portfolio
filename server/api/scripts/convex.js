const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { loadEnvironment } = require('../src/config/env');

loadEnvironment();
const packageRoot = path.dirname(require.resolve('convex/package.json'));
const command = path.join(packageRoot, 'bin/main.js');
const args = process.argv.slice(2);
const envFile = path.resolve(__dirname, '../env/.env.local');
if (['dev', 'deploy'].includes(args[0]) && fs.existsSync(envFile) && !args.includes('--env-file')) args.push('--env-file', envFile);
const result = spawnSync(process.execPath, [command, ...args], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
