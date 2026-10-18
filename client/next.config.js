const path = require('path')
const cmsMediaOrigin = new URL(process.env.CMS_MEDIA_PUBLIC_URL || 'http://localhost:1337')
 
module.exports = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  async rewrites() {
    const apiUrl = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
    const cmsUrl = (process.env.CMS_INTERNAL_URL || 'http://127.0.0.1:1337').replace(/\/$/, '');
    // Explicit routes leave future Next cache callbacks under Next's control.
    return [
      { source: '/cms-media/:path*', destination: `${cmsUrl}/uploads/:path*` },
      { source: '/api/contact', destination: `${apiUrl}/api/contact` },
      { source: '/api/content', destination: `${apiUrl}/api/content` },
      { source: '/api/admin/:path*', destination: `${apiUrl}/api/admin/:path*` },
      { source: '/api/health', destination: `${apiUrl}/api/health` },
    ];
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    // Browsers load local CMS images directly; Next blocks loopback optimizer fetches.
    unoptimized: ['localhost', '127.0.0.1', '[::1]'].includes(cmsMediaOrigin.hostname),
    remotePatterns: [
      ...[cmsMediaOrigin].map(url => ({ protocol: url.protocol.slice(0, -1), hostname: url.hostname, port: url.port, pathname: '/uploads/**' })),
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
