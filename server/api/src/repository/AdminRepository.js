class AdminRepository {
  constructor(call) { this.call = call; }
  byUsername(value) { return this.call('adminRead', { field: 'username', value }); }
  byEmail(value) { return this.call('adminRead', { field: 'email', value }); }
  byId(value) { return this.call('adminRead', { field: 'id', value }); }
  resetPassword(id, version, hash) { return this.call('adminReset', { id, version, hash }); }
  create(data) { return this.call('adminCreate', data); }
  setBlocked(username, blocked) { return this.call('adminBlock', { username, blocked }); }
}
module.exports = { AdminRepository };
