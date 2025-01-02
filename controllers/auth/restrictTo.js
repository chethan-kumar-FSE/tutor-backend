const AppError = require("../error/error");

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`you do not have permission!`, 401));
    }
    next();
  };
};
