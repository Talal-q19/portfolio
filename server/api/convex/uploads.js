import { internalActionGeneric } from 'convex/server';
import { v } from 'convex/values';
import storage from '../src/repository/StorageRepository.js';
import mutations from '../src/repository/MutationRepository.js';
import uploads from '../src/service/impl/MediaUploadServiceImpl.js';
export const complete = internalActionGeneric({
  args: { path: v.string(), method: v.string(), query: v.any(), body: v.any() },
  handler: (ctx, args) => new uploads.MediaUploadServiceImpl({ storage: new storage.StorageRepository(ctx), mutations: new mutations.MutationRepository(ctx) }).complete(args),
});
