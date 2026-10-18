const { HttpError } = require('../middleware/errors');

function validateContact(body) {
  const fields = {};
  const data = {};
  for (const [key, max] of Object.entries({ name: 100, email: 100, message: 500 })) {
    if (typeof body?.[key] !== 'string' || !body[key].trim() || body[key].length > max) {
      fields[key] = `Required text, maximum ${max} characters.`;
    } else data[key] = body[key].trim();
  }
  if (data.email && (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email) || /[\r\n]/.test(data.email))) {
    fields.email = 'Please provide a valid email address.';
  }
  if (data.name && /[\r\n\x00-\x1f\x7f]/.test(data.name)) fields.name = 'Name must be a single line.';
  if (Object.keys(fields).length) throw new HttpError(422, 'Please check the contact fields.', fields);
  return data;
}
module.exports = { validateContact };
