const { ConvexError } = require('convex/values');
const { MediaUploadService } = require('../MediaUploadService');
class MediaUploadServiceImpl extends MediaUploadService {
  constructor(repositories) { super(); this.repositories = repositories; }
  async complete(args) {
    const repositories = this.repositories;
    const file = await repositories.storage.get(args.body.storageId);
    if (!file || file.size > 8 * 1024 * 1024) throw new ConvexError({ status: 422, message: 'Invalid uploaded file.' });
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const mime = bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10' ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
      : ['GIF87a', 'GIF89a'].includes(text(0, 6)) ? 'image/gif'
      : text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP' ? 'image/webp'
      : text(0, 5) === '%PDF-' ? 'application/pdf' : null;
    if (!mime) throw new ConvexError({ status: 422, message: 'Use a valid PNG, JPEG, GIF, WebP or PDF.' });
    return repositories.mutations.execute('content', { ...args, verifiedMime: mime });
  }
}
module.exports = { MediaUploadServiceImpl };
