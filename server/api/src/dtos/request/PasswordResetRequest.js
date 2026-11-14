class PasswordResetRequest {
  static from({ resetToken, password }) { return { resetToken, password }; }
}
module.exports = { PasswordResetRequest };
