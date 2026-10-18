module.exports = ({ env }) => {
  const provider = env('UPLOAD_PROVIDER', 'local');
  if (!['local', 'cloudinary'].includes(provider)) throw new Error('Unsupported upload provider.');
  if (env('NODE_ENV') === 'production' && provider === 'local' && !env.bool('STRAPI_CLOUD', false)) {
    throw new Error('Use persistent Cloudinary media or STRAPI_CLOUD=true for Strapi Cloud storage.');
  }
  return {
    'users-permissions': { config: { jwtSecret: env('JWT_SECRET') } },
    upload: { config: {
      sizeLimit: 20 * 1024 * 1024,
      ...(provider === 'cloudinary' ? {
        provider: '@strapi/provider-upload-cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'), api_key: env('CLOUDINARY_KEY'), api_secret: env('CLOUDINARY_SECRET'),
        },
        actionOptions: { upload: {}, uploadStream: {}, delete: {} },
      } : {}),
    } },
  };
};
