import { internalMutationGeneric } from 'convex/server';
import { v } from 'convex/values';
import context from '../src/config/data-context.js';
import content from '../src/service/impl/ContentDataServiceImpl.js';
import auth from '../src/service/impl/AuthDataServiceImpl.js';
import migration from '../src/service/impl/DataMigrationServiceImpl.js';
export const execute = internalMutationGeneric({
  args: { operation: v.string(), args: v.any() },
  handler: async (ctx, { operation, args }) => {
    const repositories = context.dataContext(ctx);
    if (operation.startsWith('migration')) return new migration.DataMigrationServiceImpl(repositories).execute(operation, args);
    if (operation === 'content') return new content.ContentDataServiceImpl(repositories).execute(args);
    return new auth.AuthDataServiceImpl(repositories).execute(operation, args);
  },
});
