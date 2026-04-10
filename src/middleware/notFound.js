function notFound(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: 'Route not found'
  });
}

module.exports = { notFound };

