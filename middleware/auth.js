const AppError = require("../controllers/error/error");
const catchAsync = require("../utils/catchAsync");
const { verifyToken } = require("../controllers/auth/verifyToken");
exports.auth = catchAsync(async (req, res, next) => {
  if (req.headers.cookie) {
    let token = req.headers.cookie;
    const extractedUserData = verifyToken(token);
    req.user = extractedUserData;
    return next();
  }
  return next(new AppError("You're unauthorized", 401));
});
