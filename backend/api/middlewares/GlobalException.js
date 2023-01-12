const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    sucess: false,
    error: err.message,
    status: statusCode,
  });
};

module.exports = errorHandler;
