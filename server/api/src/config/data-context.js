const { ConvexDatabaseRepository } = require('../repository/ConvexDatabaseRepository');
const { StorageRepository } = require('../repository/StorageRepository');
function dataContext(ctx) { return { database: new ConvexDatabaseRepository(ctx), storage: new StorageRepository(ctx) }; }
module.exports = { dataContext };
