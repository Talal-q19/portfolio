const path = require('path')
const convexMediaOrigin = new URL(process.env.CONVEX_CLOUD_URL || 'https://rugged-reindeer-131.eu-west-1.convex.cloud')
 
module.exports = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    // The committed baseline contains SVG logos stored under extensionless
    // Convex URLs. Keep optimized responses sandboxed and non-executable.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: convexMediaOrigin.protocol.slice(0, -1), hostname: convexMediaOrigin.hostname, port: convexMediaOrigin.port, pathname: '/api/storage/**' },
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
