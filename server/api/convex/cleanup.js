import { internalMutationGeneric } from 'convex/server';
import context from '../src/config/data-context.js';
import cleanup from '../src/service/impl/CleanupServiceImpl.js';
export const expired = internalMutationGeneric({ args: {}, handler: ctx => new cleanup.CleanupServiceImpl(context.dataContext(ctx)).execute() });
