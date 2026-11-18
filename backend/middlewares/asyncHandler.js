// Express 4 doesn't catch rejected promises from async route handlers on
// its own; this wraps one so a thrown/rejected error reaches errorHandler
// instead of crashing the request silently.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
