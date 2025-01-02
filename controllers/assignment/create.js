const catchAsync = require("./../../utils/catchAsync");
const { pool } = require("./../../db/config");
const Response = require("./../response/response");
const AppError = require("../error/error");
const isValid = require("../../utils/checkValidDate");
const getRandomId = require("../../utils/randomId");
exports.createAssignment = catchAsync(async (req, res, next) => {
  const { student_list, description, publish_at, deadline_date } = req.body;

  //check if all values are recieved properly in req.body object
  if (
    !Object.values(req.body) ||
    !student_list ||
    !description ||
    !publish_at ||
    !deadline_date
  ) {
    return next(new AppError("Enter details properly"));
  }

  //checking if student_list is of type array or not
  if (!Array.isArray(student_list)) {
    return next(new AppError("Student list format is wrong", 400));
  }

  //if there are no students in student list then throw bad request
  if (!student_list.length) {
    return next(new AppError("No students were added, Bad request", 400));
  }

  //checking if there are all valid students and it should not include tutuorid
  const checkIfUsersAreValidQuery =
    "SELECT user_id FROM users WHERE user_id=? and role=?";
  for (const data of student_list) {
    const [userRows] = await pool.query(checkIfUsersAreValidQuery, [
      `${data}`,
      "student",
    ]);

    //if userRows length is 0 then throw error
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

  //insert the assignment details in the assignment table
  const randAssignId = getRandomId({ type: "Ass" });
  const insertAssQuery =
    "INSERT INTO assignment (assignment_id,tutor_id,description,publish_at,deadline_date) values (?,?,?,?,?)";
  const [{ affectedRows }] = await pool.query(insertAssQuery, [
    randAssignId,
    req.user.user_id,
    description,
    publish_at,
    deadline_date,
  ]);

  //if insertion query is successful then execute below code
  if (affectedRows) {
    //insert query to insert the students list in separate table whenever the new assignment is created
    //this can avoid multivalues attributes following 1NF rules
    const insertListOfStudentsQuery =
      "INSERT INTO studentlist ( assignment_id,student_id) values (?,?)";
    for (const id of student_list) {
      await pool.query(insertListOfStudentsQuery, [randAssignId, id]);
    }

    //return the response if successfully created
    return new Response(res, 201, "Your assignment is successfully created", {
      assignmentId: randAssignId,
    });
  }

  return next(new AppError("Something went wrong please try again", 500));
});
