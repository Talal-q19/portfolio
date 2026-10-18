const routes = require('../src/api/portfolio/routes/portfolio').routes;
const username = 'portfolio-local-editor';
const email = 'portfolio-local-editor@localhost.invalid';

async function provisionLocalAdmin(cms) {
  const roles = cms.db.query('plugin::users-permissions.role');
  const role = await roles.findOne({ where: { type: 'portfolio-admin' } });
  if (!role) throw new Error('PortfolioAdmin role is missing.');
  const permissions = cms.db.query('plugin::users-permissions.permission');
  for (const route of routes.filter(r => r.path.startsWith('/portfolio/admin/'))) {
    const action = `api::portfolio.${route.handler}`;
    if (!await permissions.findOne({ where: { action, role: role.id } })) await permissions.create({ data: { action, role: role.id } });
  }
  const users = cms.db.query('plugin::users-permissions.user');
  let user = await users.findOne({ where: { username }, populate: { role: true } });
  if (user && (user.email !== email || user.role?.type !== 'portfolio-admin' || user.blocked || !user.confirmed)) {
    throw new Error('The local editor account was changed or disabled. Resolve it deliberately in the CMS before provisioning.');
  }
  // This internal development identity has no password and no browser login.
  if (!user) user = await users.create({ data: { username, email, provider: 'local', confirmed: true, blocked: false, role: role.id } });
  const accessToken = await cms.plugin('users-permissions').service('jwt').issue({ id: user.id }, { expiresIn: '7d' });
  return { accessToken, userId: user.id };
}
module.exports = { provisionLocalAdmin };
