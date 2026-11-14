// JavaScript service contract. Implementations are wired in config/application-context.js.
class AdminAuthService {
  limit() { throw new Error('AdminAuthService.limit must be implemented.'); }
  login() { throw new Error('AdminAuthService.login must be implemented.'); }
  verifyLogin() { throw new Error('AdminAuthService.verifyLogin must be implemented.'); }
  forgot() { throw new Error('AdminAuthService.forgot must be implemented.'); }
  verifyReset() { throw new Error('AdminAuthService.verifyReset must be implemented.'); }
  reset() { throw new Error('AdminAuthService.reset must be implemented.'); }
  refresh() { throw new Error('AdminAuthService.refresh must be implemented.'); }
  verifyAccess() { throw new Error('AdminAuthService.verifyAccess must be implemented.'); }
  logout() { throw new Error('AdminAuthService.logout must be implemented.'); }
}
module.exports = { AdminAuthService };
