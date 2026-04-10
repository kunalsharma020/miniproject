const express = require('express');
const SchemaVersion = require('../models/SchemaVersion');
const { listSchemas, upsertSchema } = require('../services/schemaRegistry');

const router = express.Router();

// GET /schema
router.get('/', async (req, res, next) => {
  try {
    const schemas = await listSchemas();
    res.json({ schemas });
  } catch (err) {
    next(err);
  }
});

// GET /schema/:version
router.get('/:version', async (req, res, next) => {
  try {
    const doc = await SchemaVersion.findOne({ version: req.params.version }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'not_found', message: 'Schema version not found' });
    }
    res.json({ version: doc.version, previousVersion: doc.previousVersion, jsonSchema: doc.jsonSchema });
  } catch (err) {
    next(err);
  }
});

// POST /schema
// Body:
// {
//   "version": "v3",
//   "jsonSchema": {...},
//   "previousVersion": "v2",        // optional
//   "migrationKey": "v2_to_v3"      // optional, must be a trusted built-in migration key
// }
router.post('/', async (req, res, next) => {
  try {
    const { version, jsonSchema, previousVersion, migrationKey } = req.body || {};
    if (!version || !jsonSchema) {
      return res.status(400).json({
        error: 'bad_request',
        message: '`version` and `jsonSchema` are required'
      });
    }

    const doc = await upsertSchema({ version, jsonSchema, previousVersion, migrationKey });
    res.status(201).json({ ok: true, version: doc.version });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

