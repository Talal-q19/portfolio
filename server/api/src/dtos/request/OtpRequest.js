class OtpRequest {
  static from({ challengeId, code }) { return { challengeId, code }; }
}
module.exports = { OtpRequest };
