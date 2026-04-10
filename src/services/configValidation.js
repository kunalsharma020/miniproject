const SchemaVersion = require('../models/SchemaVersion');
const { getSchemaDoc, getLatestSchemaVersion, getValidator } = require('./schemaRegistry');
const { getMigrationPath, applyMigrationSteps } = require('./migrations');

function formatAjvErrors(errors) {
  return (errors || []).map((e) => ({
    instancePath: e.instancePath,
    schemaPath: e.schemaPath,
    keyword: e.keyword,
    params: e.params,
    message: e.message
  }));
}

async function validateConfigAgainstSchema(schemaVersion, config) {
  const doc = await getSchemaDoc(schemaVersion);
  const validate = getValidator(schemaVersion, doc.jsonSchema);
  const ok = validate(config);
  if (!ok) {
    const err = new Error('Configuration validation failed');
    err.statusCode = 422;
    err.code = 'validation_failed';
    err.details = formatAjvErrors(validate.errors);
    throw err;
  }
  return { config, schemaVersion };
}

async function validateAndNormalizeConfig({ schemaVersion, config }) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    const err = new Error('`config` must be a JSON object');
    err.statusCode = 400;
    err.code = 'bad_request';
    throw err;
  }

  // If schema version exists, validate directly.
  // If schema version is older than latest and a migration path exists, optionally migrate to latest.
  const requestedSchema = await getSchemaDoc(schemaVersion);
  const latest = (await getLatestSchemaVersion()) || requestedSchema.version;

  // Always validate input against requested schema first for better error messages.
  await validateConfigAgainstSchema(requestedSchema.version, config);

  if (requestedSchema.version === latest) {
    return { normalizedConfig: config, effectiveSchemaVersion: requestedSchema.version };
  }

  // Attempt migration forward to latest if possible.
  const allDocs = await SchemaVersion.find({}).lean();
  const map = new Map(allDocs.map((d) => [d.version, d]));
  const steps = getMigrationPath(requestedSchema.version, latest, map);

  if (!steps) {
    return { normalizedConfig: config, effectiveSchemaVersion: requestedSchema.version };
  }

  const migrated = applyMigrationSteps(config, steps);
  await validateConfigAgainstSchema(latest, migrated);

  return { normalizedConfig: migrated, effectiveSchemaVersion: latest };
}

module.exports = {
  validateAndNormalizeConfig
};

