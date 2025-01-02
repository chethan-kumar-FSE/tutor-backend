const { pool } = require("./../../db/config");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/error");
const Response = require("./../response/response");
const bcrypt = require("bcrypt");
const { createToken } = require("./createToken");
const getRandomId = require("../../utils/randomId");
//signup the users on initial registration
exports.signup = catchAsync(async (req, res, next) => {
  const { username, password, role } = req.body;
  const allowedRoles = ["tutor", "student"];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //check if there is not username or password or role or if req.body object is empty
  if (!Object.values(req.body).length || !username || !password || !role) {
    return next(new AppError("Please enter your details properly", 500));
  }

  //check if valid emailid / username
  if (!emailRegex.test(username)) {
    return next(new AppError("Enter a valid email ID"));
  }
  //throw error if password length is of 5
  if (password.length < 5) {
    return next(
      new AppError("Password length must atleast be 5 charcters", 500)
    );
  }
  //if role is not student and tutor then its a bad request
  if (!allowedRoles.includes(role)) {
    return next(new AppError("Bad Request", 400));
  }

  //insert user details into users DB
  const insertUserQuery =
    "INSERT INTO USERS (user_id,username,password,role) values (?,?,?,?)";

  //hash the password before storing in database
  const hashedPassword = await bcrypt.hash(password, 10);
  const [{ insertId }] = await pool.query(insertUserQuery, [
    getRandomId({ type: "User" }),
    username,
    hashedPassword,
    role,
  ]);

  //get the user details after insertion
  const selectUserQuery = `SELECT user_id,username,role from USERS WHERE user_id=?`;
  const [user] = await pool.query(selectUserQuery, [insertId]);

  //creating json after the success user registration
  const token = createToken(user[0]);

  //attaching the jwt token to cookies
  res.cookie("jwt", token, {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 24 * 60,
  });
  return new Response(res, 200, "User Inserted Successfully", {
    ...user[0],
    token,
  });
});
