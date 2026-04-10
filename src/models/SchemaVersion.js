const mongoose = require('mongoose');

const SchemaVersionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true, index: true },
    jsonSchema: { type: mongoose.Schema.Types.Mixed, required: true },
    // A trusted, server-side migration key (not user-provided code).
    // If provided, indicates how to migrate from `previousVersion` -> `version`.
    previousVersion: { type: String },
    migrationKey: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchemaVersion', SchemaVersionSchema);

