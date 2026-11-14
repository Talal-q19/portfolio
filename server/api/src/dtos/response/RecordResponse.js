// Database metadata never leaves the data-service boundary.
function plain(row) {
  if (!row) return null;
  const { _id, _creationTime, ...data } = row;
  return data;
}
module.exports = { plain };
