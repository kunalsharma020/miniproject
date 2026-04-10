const SchemaVersion = require('../models/SchemaVersion');
const { ajv } = require('../ajv');

const validatorCache = new Map(); // schemaVersion -> validateFn

async function listSchemas() {
  const docs = await SchemaVersion.find({}, { version: 1, previousVersion: 1, migrationKey: 1 })
    .sort({ createdAt: 1 })
    .lean();
  return docs;
}

async function getSchemaDoc(version) {
  const doc = await SchemaVersion.findOne({ version }).lean();
  if (!doc) {
    const err = new Error(`Unknown schema version: ${version}`);
    err.statusCode = 400;
    err.code = 'unknown_schema_version';
    throw err;
  }
  return doc;
}

async function getLatestSchemaVersion() {
  const doc = await SchemaVersion.findOne({}, { version: 1 }).sort({ createdAt: -1 }).lean();
  return doc?.version || null;
}

function getValidator(schemaVersion, jsonSchema) {
  if (validatorCache.has(schemaVersion)) return validatorCache.get(schemaVersion);
  const validate = ajv.compile(jsonSchema);
  validatorCache.set(schemaVersion, validate);
  return validate;
}

async function upsertSchema({ version, jsonSchema, previousVersion, migrationKey }) {
  // compile once to ensure schema is valid
  ajv.compile(jsonSchema);
  validatorCache.delete(version);

  const doc = await SchemaVersion.findOneAndUpdate(
    { version },
    { $set: { version, jsonSchema, previousVersion: previousVersion || undefined, migrationKey: migrationKey || undefined } },
    { upsert: true, new: true }
  );
  return doc;
}

module.exports = {
  listSchemas,
  getSchemaDoc,
  getLatestSchemaVersion,
  getValidator,
  upsertSchema
};

