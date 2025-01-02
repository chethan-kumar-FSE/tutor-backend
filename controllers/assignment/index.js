const { createAssignment } = require("./create");
const { deleteAssignment } = require("./delete");
const { updateAssignment } = require("./update");
const { submitAssignment } = require("./submit");
const { retrieve } = require("./retrieve");
const { retrieveFeed } = require("./retrieveFeed");

module.exports = {
  createAssignment,
  deleteAssignment,
  updateAssignment,
  submitAssignment,
  retrieve,
  retrieveFeed,
};
