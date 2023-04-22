function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/user/login');
}

function ensureNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) return next();
  return res.redirect('/');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) return next();
  return res.redirect('/');
}

module.exports = { ensureAuthenticated, ensureNotAuthenticated, ensureAdmin };
