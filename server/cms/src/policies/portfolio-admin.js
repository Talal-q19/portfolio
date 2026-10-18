module.exports = async (ctx, config, { strapi }) => {
  const id = ctx.state.user?.id;
  if (!id) return false;
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id }, populate: { role: true } });
  return Boolean(user && !user.blocked && user.confirmed && user.role?.type === 'portfolio-admin');
};
