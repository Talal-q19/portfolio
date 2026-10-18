const { createGuard, initializeLock, guardMediaDeletion } = require('./portfolio/guard');
const { bootstrapPortfolio } = require('./portfolio/bootstrap');

module.exports = {
  register({ strapi }) { strapi.documents.use(createGuard(strapi)); },
  async bootstrap({ strapi }) {
    await initializeLock(strapi);
    guardMediaDeletion(strapi);
    await bootstrapPortfolio(strapi);
  },
};
