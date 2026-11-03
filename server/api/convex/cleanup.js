import { internalMutationGeneric } from 'convex/server';
export const expired = internalMutationGeneric({ args: {}, handler: async ctx => {
  const now = Date.now();
  for (const table of ['authState', 'uploadTickets']) {
    const rows = await ctx.db.query(table).withIndex('expiry', q => q.lt('expiresAt', now)).take(500);
    for (const row of rows) await ctx.db.delete(row._id);
  }
  // Upload URLs can outlive their UI ticket. Delete only old, unattached blobs.
  const files = await ctx.db.system.query('_storage').order('asc').take(500);
  for (const file of files) {
    if (file._creationTime > now - 86400000) continue;
    const attached = await ctx.db.query('media').withIndex('storageId', q => q.eq('storageId', file._id)).first();
    if (!attached) await ctx.storage.delete(file._id);
  }
  return null;
} });
