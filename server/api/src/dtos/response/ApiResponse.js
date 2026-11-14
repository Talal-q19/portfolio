class ApiResponse {
  static success(message) { return { success: true, ...(message ? { message } : {}) }; }
}
module.exports = { ApiResponse };
