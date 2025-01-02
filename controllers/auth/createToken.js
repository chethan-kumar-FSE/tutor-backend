const jwt = require("jsonwebtoken");

//function to create token and return
exports.createToken = (data) => {
  return jwt.sign({ ...data }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
};
