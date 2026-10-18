const path = require('node:path');
module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');
  if (!['sqlite', 'postgres'].includes(client)) throw new Error('Use sqlite or postgres.');
  if (env('NODE_ENV') === 'production' && client !== 'postgres') throw new Error('Production CMS requires PostgreSQL.');
  return { connection: {
    client,
    connection: client === 'sqlite' ? {
      filename: path.resolve(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
    } : {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) } : false,
    },
    useNullAsDefault: client === 'sqlite',
    pool: client === 'sqlite' ? { min: 1, max: 1 } : { min: 2, max: 10 },
    acquireConnectionTimeout: 60000,
  } };
};
