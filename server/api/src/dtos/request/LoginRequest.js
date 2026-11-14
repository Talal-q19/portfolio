class LoginRequest {
  static from({ username, password }) { return { username, password }; }
}
module.exports = { LoginRequest };
