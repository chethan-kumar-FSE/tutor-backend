const catchAsync = require("./../../utils/catchAsync");
const { pool } = require("./../../db/config");
const Response = require("./../response/response");
const AppError = require("../error/error");

exports.deleteAssignment = catchAsync(async (req, res, next) => {
  const { id: assignmentId } = req.params;

  //checking if params is received properly from req.params object
  if (!assignmentId || !Object.values(req.params).length) {
    return next(new AppError("Please enter the assignment id to delete", 400));
  }

  //delete query to delete assignment based on the assingment id passed in params
  const deleteAssQuery = "DELETE FROM assignment WHERE assignment_id=?";

  //waiting for the query execution to send the successful response
  const [assignmentRows] = await pool.query(deleteAssQuery, [assignmentId]);
  if (!assignmentRows.affectedRows) {
    return next(new AppError("The assignment is not found to delete", 404));
  }

  //send response if delete is successful
  return new Response(
    res,
    200,
    `Your assignment with id${assignmentId} is successfully delete`
  );
});
