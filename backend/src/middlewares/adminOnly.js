const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Owner only.' });
};

module.exports = { adminOnly };
