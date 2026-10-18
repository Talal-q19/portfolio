const { templates } = require('@portfolio/content-contract');
const { CATEGORY } = require('./guard');

async function bootstrapPortfolio(strapi) {
  let order = 0;
  for (const [slug, template] of Object.entries(templates)) {
    const exists = await strapi.db.query(CATEGORY).findOne({ where: { slug } });
    if (!exists) await strapi.documents(CATEGORY).create({ data: {
      name: template.name, slug, templateKey: slug, cardinality: template.cardinality, displayOrder: order, visible: true,
    } });
    order++;
  }
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = await store.get({ key: 'advanced' }) || {};
  await store.set({ key: 'advanced', value: { ...advanced, allow_register: false } });
  const roles = strapi.db.query('plugin::users-permissions.role');
  const admin = await roles.findOne({ where: { type: 'portfolio-admin' } });
  if (!admin) await roles.create({ data: { name: 'PortfolioAdmin', type: 'portfolio-admin', description: 'Invite-only portfolio editors; permissions are activated with phase-5 authentication.' } });
  // This phase exposes no content API permissions, including authenticated users.
  // Built-in Strapi administrators use the separate admin RBAC system.
  await strapi.db.query('plugin::users-permissions.permission').deleteMany({ where: { action: { $startsWith: 'api::category.' } } });
  await strapi.db.query('plugin::users-permissions.permission').deleteMany({ where: { action: { $startsWith: 'api::content.' } } });
}
module.exports = { bootstrapPortfolio };
