function isValid(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  const isMatch = regex.test(dateString);
  return isMatch;
}
module.exports = isValid;
