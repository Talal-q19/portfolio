// Uses a temporary HTTP listener; it does not create accounts or leave CMS running.
const { createStrapi } = require('@strapi/strapi');
async function main() {
  const cms = await createStrapi({ appDir: process.cwd(), distDir: process.cwd() }).load();
  try {
    await new Promise(resolve => cms.server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${cms.server.httpServer.address().port}`;
    const response = await fetch(`${base}/admin`);
    const html = await response.text();
    if (response.status !== 200 || !html.includes('<html')) throw new Error('Admin did not load.');
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
    if (!assets.length) throw new Error('No built admin assets found.');
    for (const asset of assets) {
      if (!(await fetch(new URL(asset, `${base}/admin/`))).ok) throw new Error(`Admin asset failed: ${asset}`);
    }
    console.log(`PASS: admin HTML and ${assets.length} JS/CSS assets.`);
  } finally { await cms.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
