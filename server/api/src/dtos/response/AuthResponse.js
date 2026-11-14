class AuthResponse {
  static session(admin) { return { username: admin.username }; }
  static identity(admin) { return { id: admin.id, username: admin.username, role: 'portfolio-admin' }; }
  static challenge(challengeId) { return { challengeId, expiresIn: 300, message: 'If the account is eligible, a verification code has been sent.' }; }
  static resetGrant(resetToken) { return { resetToken, expiresIn: 300 }; }
}
module.exports = { AuthResponse };
