// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  // Only expose err.message for errors explicitly thrown with a status (deliberate,
  // safe-to-show messages). Anything else is an unexpected error — its message may
  // contain internal details (e.g. raw DB errors) and must not reach the client.
  const message = err.status ? err.message : 'Internal server error';
  res.status(status).json({ error: { message } });
};
