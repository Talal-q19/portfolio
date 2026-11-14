const { makeFunctionReference } = require('convex/server');
class MutationRepository {
  constructor(ctx) { this.ctx = ctx; }
  execute(operation, args) { return this.ctx.runMutation(makeFunctionReference('bridge:execute'), { operation, args }); }
}
module.exports = { MutationRepository };
