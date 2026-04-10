const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  removeAdditional: false
});

addFormats(ajv);

module.exports = { ajv };

