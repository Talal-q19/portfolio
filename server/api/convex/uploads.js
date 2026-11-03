import { internalActionGeneric, makeFunctionReference } from 'convex/server';
import { v, ConvexError } from 'convex/values';
export const complete = internalActionGeneric({
  args: { path: v.string(), method: v.string(), query: v.any(), body: v.any() },
  handler: async (ctx, args) => {
    const file = await ctx.storage.get(args.body.storageId);
    if (!file || file.size > 8 * 1024 * 1024) throw new ConvexError({ status: 422, message: 'Invalid uploaded file.' });
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const mime = bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10' ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
      : ['GIF87a', 'GIF89a'].includes(text(0, 6)) ? 'image/gif'
      : text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP' ? 'image/webp'
      : text(0, 5) === '%PDF-' ? 'application/pdf' : null;
    if (!mime) throw new ConvexError({ status: 422, message: 'Use a valid PNG, JPEG, GIF, WebP or PDF.' });
    return ctx.runMutation(makeFunctionReference('bridge:execute'), { operation: 'content', args: { ...args, verifiedMime: mime } });
  },
});
