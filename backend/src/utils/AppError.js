class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export default AppError;