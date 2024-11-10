module.exports.all = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.status(404).json({ message: "Please login!" });
  }
  next();
};
