// Last-resort error handler: catches anything a controller passed to next(err).
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ status: "error", message: err.message });
}
