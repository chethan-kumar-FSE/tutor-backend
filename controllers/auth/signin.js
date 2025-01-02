const jwt = require("jsonwebtoken");
const { pool } = require("./../../db/config");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/error");
const bcrypt = require("bcrypt");
const { createToken } = require("./createToken");
const Response = require("./../response/response");

exports.signin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  //check if there is not username or password or if req.body object is empty
  if (!Object.values(req.body).length || !username || !password) {
    return next(new AppError("please enter you details properly", 500));
  }

  //check if username is presernt in DB
  const checkIfUserExistQuery = "SELECT * FROM USERS where username=?";
  const [userRows] = await pool.query(checkIfUserExistQuery, [username]);

  //if user not found then return unauthorized
  if (!userRows.length) {
    return next(new AppError("User not found", 401));
  }

  //check if password is a valid password using bcrypt.compare
  console.log(password, userRows[0].password);
  const isValidUser = await bcrypt.compare(password, userRows[0].password);
  if (!isValidUser) {
    return next(new AppError("Wrong password, unauthorised !", 401));
  }

  //destructuring user object
  const { user_id, role } = userRows[0];

  //token creation
  const token = createToken({ user_id, username, role });

  //once the token generates attach the cookies
  res.cookie("jwt", token, {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 24 * 60,
  });

  return new Response(res, 200, "User logged in !", {
    user_id,
    role,
    username,
    token,
  });
});
