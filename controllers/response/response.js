class Response {
  constructor(response, statusCode, message, data) {
    if (data) {
      this.data = data;
    }
    this.statusCode = statusCode;
    this.message = message;
    return response.status(statusCode).json({
      ...this,
    });
  }
}

module.exports = Response;
