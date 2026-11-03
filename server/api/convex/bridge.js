import { internalMutationGeneric } from 'convex/server';
import { v } from 'convex/values';
import { authOperation } from './state';
import { contentOperation } from './content';
import { migrationOperation } from './migration';
export const execute = internalMutationGeneric({
  args: { operation: v.string(), args: v.any() },
  handler: async (ctx, { operation, args }) => operation.startsWith('migration') ? migrationOperation(ctx, operation, args) : operation === 'content' ? contentOperation(ctx, args) : authOperation(ctx, operation, args),
});
