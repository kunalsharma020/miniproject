function apiKeyAuth(req, res, next) {
  // allow health without auth (already mounted before this middleware)
  const expected = process.env.API_KEY;
  if (!expected) {
    return res.status(500).json({
      error: 'server_misconfigured',
      message: 'API_KEY is not set on the server'
    });
  }

  const provided = req.header('x-api-key');
  if (!provided || provided !== expected) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid API key'
    });
  }

  next();
}

module.exports = { apiKeyAuth };

