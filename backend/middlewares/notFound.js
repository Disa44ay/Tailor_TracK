// Catches any request that didn't match a route above it.
export function notFound(req, res) {
  res.status(404).json({ status: "error", message: `Not found: ${req.method} ${req.path}` });
}
