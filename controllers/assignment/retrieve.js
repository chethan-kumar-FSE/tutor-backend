const { pool } = require("../../db/config");
const catchAsync = require("../../utils/catchAsync");
const Response = require("./../response/response");
const AppError = require("../error/error");

exports.retrieve = catchAsync(async (req, res, next) => {
  //incase of tutor access the assignment id
  const { id: assignmentId } = req.params;

  //checking if values are valid or not
  if (!Object.values(req.params).length || !assignmentId) {
    return next(new AppError("assignment id was not passed"));
  }

  //check if request assignment id is present or not
  const checkIfAssIdPresentQuery =
    "SELECT assignment_id FROM assignment WHERE assignment_id=?";
  const [assignmentRows] = await pool.query(checkIfAssIdPresentQuery, [
    assignmentId,
  ]);

  //if no records found with assignment then throw error
  if (!assignmentRows.length) {
    return next(new AppError("No assignment found!", 404));
  }

  //check if user role is student or tutor
  if (req.user.role === "student") {
    //fetch the assignment submitted by student
    const fetchSubmittedAssQuery =
      "SELECT * FROM submission WHERE assignment_id=? and student_id=?";
    const [submissionRows] = await pool.query(fetchSubmittedAssQuery, [
      assignmentId,
      req.user.user_id,
    ]);

    //if no submission found then return empty array
    if (!submissionRows.length) {
      return new Response(res, 200, "No records found", []);
    }

    //else return the response
    return new Response(res, 200, "Submission fetched successfully", {
      submissionRows,
    });
  }

  //executes if user is tutor
  //fetch all assignment created that by tutor and submitted by students
  const getAllAssignmentQuery =
    "SELECT * FROM submission WHERE assignment_id=?";
  const [submissionRows] = await pool.query(getAllAssignmentQuery, [
    assignmentId,
  ]);

  //if submission length is zero then return empty array
  if (!submissionRows.length) {
    return new Response(res, 200, "No records found", []);
  }

  //else send the response
  return new Response(res, 200, "Fetched successfully", { ...submissionRows });
});
