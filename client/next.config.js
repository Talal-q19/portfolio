const path = require('path')
 
module.exports = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  async rewrites() {
    const apiUrl = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
    // Explicit routes leave future Next cache callbacks under Next's control.
    return [
      { source: '/api/contact', destination: `${apiUrl}/api/contact` },
      { source: '/api/health', destination: `${apiUrl}/api/health` },
    ];
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media.dev.to',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media2.dev.to',
        pathname: '**',
      },
    ],
  },
}
