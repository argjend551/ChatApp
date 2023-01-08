export const InvalidInputException = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
