const catchAsync = require("./../../utils/catchAsync");
const { pool } = require("./../../db/config");
const Response = require("./../response/response");
const AppError = require("../error/error");
const isValid = require("../../utils/checkValidDate");

exports.updateAssignment = catchAsync(async (req, res, next) => {
  const { id: assignmentId } = req.params;

  const { student_list, description, publish_at, deadline_date } = req.body;

  //checking if all values are received properly in the req.body object
  if (
    !Object.values(req.body) ||
    !student_list ||
    !description ||
    !publish_at ||
    !deadline_date
  ) {
    return next(new AppError("Enter details properly", 400));
  }
  //checking if student_list is of type array or not
  if (!Array.isArray(student_list)) {
    return next(new AppError("Student list format is wrong", 400));
  }

  //throw error if student list is empty
  if (!student_list.length) {
    return next(new AppError("Student list is empty", 400));
  }

  //checking if there are all valid students and it should not include tutuorid
  const checkIfUsersAreValidQuery =
    "SELECT user_id FROM users where user_id=? and role=?";
  for (const data of student_list) {
    const [userRows] = await pool.query(checkIfUsersAreValidQuery, [
      data,
      "student",
    ]);
    if (!userRows.length) {
      return next(
        new AppError(
          "Invalid student id was passed or you're trying to add tutors to assignment",
          400
        )
      );
    }
  }

  //checking if publish at date / deadline date are valid date or not
  if (!isValid(publish_at) || !isValid(deadline_date)) {
    return next(
      new AppError(
        "publish date or deadline date are not in right format--YYYY-MM-DD",
        400
      )
    );
  }

  //if deadline date is lesser than or equals to today's date then throw bad request
  if (new Date(deadline_date) < new Date()) {
    return next(
      new AppError(
        "deadline date cannot lesser than or equals to today's date",
        400
      )
    );
  }

  //if publish_at date is greater than than deadline date then throw bad request
  if (new Date(publish_at) > new Date(deadline_date)) {
    return next(
      new AppError(
        "publish date is greater than deadline date,pass valid dates",
        400
      )
    );
  }

  //before updating delete the entire student list items from student list table
  const deleteStudentListItemsQuery =
    "DELETE FROM studentlist where assignment_id=?";
  const [studentListRows] = await pool.query(deleteStudentListItemsQuery, [
    assignmentId,
  ]);

  if (!studentListRows.affectedRows) {
    return next(new AppError("No records found to update", 404));
  }

  //insert student list newly for the corresponding assignment id
  const insertListOfStudentsQuery =
    "INSERT INTO studentlist ( assignment_id,student_id) values (?,?)";

  //waits for query execution before the next iteration
  for (const id of student_list) {
    await pool.query(insertListOfStudentsQuery, [assignmentId, id]);
  }
  return new Response(res, 201, "Updated assignment successfully");
});
