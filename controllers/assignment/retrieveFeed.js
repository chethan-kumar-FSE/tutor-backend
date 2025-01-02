const { pool } = require("../../db/config");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../error/error");
const Response = require("../response/response");

//reusable function to fetch scheduled and ongoing assignments for both tutor and student
const returnFilteredAssignments = (assignments, publish) => {
  let filteredAssignment = [];
  if (publish === "SCHEDULED") {
    filteredAssignment = assignments.filter((assignment) => {
      return new Date() < new Date(assignment["publish_at"]);
    });
  } else if (publish === "ONGOING") {
    filteredAssignment = assignments.filter((assignment) => {
      return (
        new Date(assignment["publish_at"]) <= new Date() &&
        new Date() <= new Date(assignment["deadline_date"])
      );
    });
  } else {
    filteredAssignment = assignments;
  }
  return filteredAssignment;
};

exports.retrieveFeed = catchAsync(async (req, res, next) => {
  const { publish, status } = req.query;
  const statusParams = ["PENDING", "SUBMITTED", "OVERDUE"];
  const publishParams = ["ONGOING", "SCHEDULED"];

  //check if parameter key name is valid, if not throw bad request
  const allowedKeys = ["publish", "status"];
  for (const key in req.query) {
    if (!allowedKeys.includes(key)) {
      return next(new AppError("Bad request", 400));
    }
  }

  //check if publish and status contains valid parameters
  if (
    (publish && !publishParams.includes(publish)) ||
    (status && !statusParams.includes(status))
  ) {
    return next(new AppError("Requesting unknown parameters", 400));
  }

  if (req.user.role === "tutor") {
    //first check if tutor_id is present in the db or not
    const getAllAssByTutorQuery = "SELECT * FROM assignment where tutor_id=?";
    const [assingnmentRows] = await pool.query(getAllAssByTutorQuery, [
      req.user.user_id,
    ]);
    //if not assignments found
    if (!assingnmentRows.length) {
      return next(new AppError("No assignment found", 404));
    }
    //check if publish is schedules /ongoing based on that filter than assignments
    const filteredAssOnPublish = returnFilteredAssignments(
      assingnmentRows,
      publish
    );
    return new Response(
      res,
      200,
      "assignments fetched successfully",
      filteredAssOnPublish
    );
  }

  //get all assignments of particular students join both assignment and studentlist table
  const getAllAssAssignedToStudentsQuery =
    "SELECT a.assignment_id,tutor_id,a.description,a.publish_at,a.deadline_date FROM assignment a JOIN studentlist s ON a.assignment_id=s.assignment_id WHERE s.student_id=?";

  const [assignmentJoinedWithListRows] = await pool.query(
    getAllAssAssignedToStudentsQuery,
    [req.user.user_id]
  );

  //get filtered data on publish data provided
  const filteredAssOnPublish = returnFilteredAssignments(
    assignmentJoinedWithListRows,
    publish
  );

  //get all the submissions made by student
  const getAllSubmissionsByStudQuery =
    "SELECT * FROM submission WHERE student_id=?";

  const [submissionRows] = await pool.query(getAllSubmissionsByStudQuery, [
    req.user.user_id,
  ]);
  const submittedAssignmentIds = [];

  //store all the assignment value in array for use
  submissionRows.forEach((submission) => {
    submittedAssignmentIds.push(submission.assignment_id);
  });

  //create status empty array
  let filtersOnStatus = [];

  //using switch case to filter the assignment based on the status data provided
  switch (status) {
    case "PENDING": {
      filtersOnStatus = assignmentJoinedWithListRows.filter((assignment) => {
        return (
          new Date(assignment["publish_at"]) < new Date() &&
          new Date() < new Date(assignment["deadline_date"]) &&
          !submittedAssignmentIds.includes(assignment["assignment_id"])
        );
      });
      console.log(filtersOnStatus);
      break;
    }
    case "OVERDUE": {
      filtersOnStatus = assignmentJoinedWithListRows.filter((assignment) => {
        return (
          new Date() > new Date(assignment["deadline_date"]) &&
          !submittedAssignmentIds.includes(assignment.assignment_id)
        );
      });
      break;
    }
    case "SUBMITTED": {
      filtersOnStatus = submissionRows;
      break;
    }
    default: {
      filtersOnStatus = assignmentJoinedWithListRows;
    }
  }

  //return filtered data once the filtering
  return new Response(res, 200, "Data fetched successfully", {
    [publish || "All Publish"]: filteredAssOnPublish,
    [status || "All Status"]: filtersOnStatus,
  });
});
