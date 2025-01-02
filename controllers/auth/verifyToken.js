const jwt = require("jsonwebtoken");

//verify the token to access resource
exports.verifyToken = (token) => {
  const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return isVerified;
};
