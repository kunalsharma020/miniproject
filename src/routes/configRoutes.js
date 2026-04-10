const express = require('express');
const Config = require('../models/Config');
const ConfigMeta = require('../models/ConfigMeta');
const { validateAndNormalizeConfig } = require('../services/configValidation');
const { getActiveConfig, setActiveVersion, setActiveVersionToPrevious } = require('../services/configVersioning');

const router = express.Router();

// POST /config
// Body:
// {
//   "schemaVersion": "v1" | "v2" (optional; defaults to DEFAULT_SCHEMA_VERSION),
//   "config": { ... }
// }
router.post('/', async (req, res, next) => {
  try {
    const schemaVersion = req.body?.schemaVersion || process.env.DEFAULT_SCHEMA_VERSION || 'v1';
    const config = req.body?.config;

    const { normalizedConfig, effectiveSchemaVersion } = await validateAndNormalizeConfig({
      schemaVersion,
      config
    });

    const latest = await Config.findOne({}, { version: 1 }).sort({ version: -1 }).lean();
    const nextVersion = (latest?.version || 0) + 1;

    const doc = await Config.create({
      version: nextVersion,
      schemaVersion: effectiveSchemaVersion,
      payload: normalizedConfig
    });

    await ConfigMeta.findByIdAndUpdate(
      'singleton',
      { $set: { activeVersion: doc.version } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      ok: true,
      version: doc.version,
      schemaVersion: doc.schemaVersion
    });
  } catch (err) {
    next(err);
  }
});

// GET /config/latest
router.get('/latest', async (req, res, next) => {
  try {
    const active = await getActiveConfig();
    if (!active) {
      return res.status(404).json({
        error: 'not_found',
        message: 'No config found'
      });
    }

    res.json({
      version: active.version,
      schemaVersion: active.schemaVersion,
      config: active.payload,
      createdAt: active.createdAt
    });
  } catch (err) {
    next(err);
  }
});

// POST /config/rollback
// Rolls active pointer back to previous version, or sets a specific version.
// Body (optional):
// { "version": 3 }
router.post('/rollback', async (req, res, next) => {
  try {
    const requested = req.body?.version;
    if (requested !== undefined) {
      const v = Number(requested);
      if (!Number.isInteger(v) || v <= 0) {
        return res.status(400).json({ error: 'bad_request', message: '`version` must be a positive integer' });
      }
      const set = await setActiveVersion(v);
      if (!set.ok) return res.status(set.status).json({ error: set.code, message: set.message });
      return res.json({ ok: true, activeVersion: set.activeVersion });
    }

    const result = await setActiveVersionToPrevious();
    if (!result.ok) {
      return res.status(result.status).json({ error: result.code, message: result.message });
    }
    res.json({ ok: true, activeVersion: result.activeVersion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

