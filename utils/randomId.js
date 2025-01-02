function getRandomId({ type }) {
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;

  // Convert the random number to a string
  const assignmentID = randomNumber.toString();
  return type + assignmentID;
}
module.exports = getRandomId;
