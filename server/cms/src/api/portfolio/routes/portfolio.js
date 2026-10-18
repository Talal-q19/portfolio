const admin = { policies: ['global::portfolio-admin'] };
module.exports = { routes: [
  { method: 'GET', path: '/portfolio/read', handler: 'portfolio.read', config: {} },
  ...['categories', 'content', 'media'].flatMap(resource => [
    { method: 'GET', path: `/portfolio/admin/${resource}`, handler: `portfolio.${resource}List`, config: admin },
    { method: 'POST', path: `/portfolio/admin/${resource}`, handler: `portfolio.${resource}Create`, config: admin },
    { method: 'GET', path: `/portfolio/admin/${resource}/:id`, handler: `portfolio.${resource}Read`, config: admin },
    { method: 'DELETE', path: `/portfolio/admin/${resource}/:id`, handler: `portfolio.${resource}Delete`, config: admin },
    ...(resource !== 'media' ? [{ method: 'PATCH', path: `/portfolio/admin/${resource}/:id`, handler: `portfolio.${resource}Update`, config: admin }] : []),
  ]),
] };
