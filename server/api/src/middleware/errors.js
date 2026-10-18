class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.type === 'entity.too.large' ? 413
    : error.type === 'entity.parse.failed' ? 400
    : error instanceof HttpError ? error.status : 500;
  const message = status === 413 ? 'Request body is too large.'
    : status === 400 ? 'Invalid request body.'
    : error instanceof HttpError ? error.message : 'Failed to send message.';
  res.status(status).json({ success: false, message, ...(error.fields ? { fields: error.fields } : {}) });
}
module.exports = { HttpError, errorHandler };
