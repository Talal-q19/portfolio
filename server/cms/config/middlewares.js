module.exports = [
  'strapi::logger', 'strapi::errors',
  { name: 'strapi::security', config: { contentSecurityPolicy: { useDefaults: true, directives: {
    'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
    'media-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
  } } } },
  'strapi::cors', 'strapi::poweredBy', 'strapi::query',
  { name: 'strapi::body', config: { jsonLimit: '1mb', formLimit: '1mb', formidable: { maxFileSize: 20 * 1024 * 1024 } } },
  'strapi::session', 'strapi::favicon', 'strapi::public',
];
