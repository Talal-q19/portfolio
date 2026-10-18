// Only the configured local CMS upload origin is proxied. External provider URLs stay intact.
export function mediaUrl(value, cmsOrigin = process.env.CMS_MEDIA_PUBLIC_URL || 'http://localhost:1337') {
  if (!value) return '';
  try {
    const url = new URL(value);
    const configured = new URL(cmsOrigin);
    const loopback = host => ['localhost', '127.0.0.1', '[::1]'].includes(host);
    if (loopback(configured.hostname) && loopback(url.hostname)
      && url.protocol === configured.protocol && url.port === configured.port
      && url.pathname.startsWith('/uploads/') && !url.username && !url.password) {
      return `/cms-media/${url.pathname.slice('/uploads/'.length)}${url.search}`;
    }
  } catch { /* Existing local paths and non-URL empty values pass through. */ }
  return value;
}
