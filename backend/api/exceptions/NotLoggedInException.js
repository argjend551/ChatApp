export const NotLoggedInException = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
