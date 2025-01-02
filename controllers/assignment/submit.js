const { pool } = require("../../db/config");
const catchAsync = require("../../utils/catchAsync");
const Response = require("./../response/response");
const AppError = require("../error/error");
exports.submitAssignment = catchAsync(async (req, res, next) => {
  const { assignment_id, remark } = req.body;

  //checking if all values recieved properly or not
  if (!Object.values(req.body).length || !assignment_id || !remark) {
    return next(new AppError("Enter submission details properly", 400));
  }

  //check if assingment id is present in assignment database or not
  const checkAssIdQuery =
    "SELECT assignment_id,publish_at from assignment WHERE assignment_id=?";
  const [assignmentRows] = await pool.query(checkAssIdQuery, [assignment_id]);
  if (!assignmentRows.length) {
    return next(new AppError("The assignment id is not found", 400));
  }

  //student cannot make submission before the publish date
  if (new Date(assignmentRows[0].publish_at) > new Date()) {
    return next(
      new AppError(
        "The assignment can be only be submitted on or after publish date"
      )
    );
  }

  //check if you're alloted to this particular assignment
  const checkIfAssAllotedToStudentQuery =
    "SELECT assignment_id,student_id from studentlist where assignment_id=? and student_id=?";
  const [studentListRows] = await pool.query(checkIfAssAllotedToStudentQuery, [
    assignment_id,
    req.user.user_id,
  ]);

  //if rows zero it means requested assingment was not assigned for the user
  if (!studentListRows.length) {
    return next(
      new AppError("You're not assigned this particular assignment", 400)
    );
  }

  //check if user has already done the submission
  const checkIfSubmissionIsDoneQuery =
    "SELECT assignment_id,student_id FROM submission where assignment_id=? and student_id=?";
  const [submissionRows] = await pool.query(checkIfSubmissionIsDoneQuery, [
    assignment_id,
    req.user.user_id,
  ]);

  //if submission is already done , then throw error
  if (submissionRows.length) {
    return next(new AppError("Only once the submission is allowed", 409));
  }

  //inserts the details into table if all above conditions satisfies
  const insertSubmissionQuery =
    "INSERT INTO submission (assignment_id,student_id,remark) values (?,?,?)";
  await pool.query(insertSubmissionQuery, [
    assignment_id,
    req.user.user_id,
    remark,
  ]);

  return new Response(res, 201, "Assignment is submitted successfully");
});
