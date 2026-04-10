const Config = require('../models/Config');
const ConfigMeta = require('../models/ConfigMeta');

async function getActiveVersion() {
  const meta = await ConfigMeta.findById('singleton').lean();
  return meta?.activeVersion || null;
}

async function getActiveConfig() {
  const activeVersion = await getActiveVersion();
  if (activeVersion) {
    const active = await Config.findOne({ version: activeVersion }).lean();
    if (active) return active;
  }
  return await Config.findOne({}).sort({ version: -1 }).lean();
}

async function setActiveVersion(version) {
  const exists = await Config.findOne({ version }, { version: 1 }).lean();
  if (!exists) {
    return { ok: false, status: 404, code: 'not_found', message: `Config version ${version} not found` };
  }
  await ConfigMeta.findByIdAndUpdate('singleton', { $set: { activeVersion: version } }, { upsert: true });
  return { ok: true, activeVersion: version };
}

async function setActiveVersionToPrevious() {
  const active = await getActiveConfig();
  if (!active) return { ok: false, status: 404, code: 'not_found', message: 'No config found' };

  const prev = await Config.findOne({ version: { $lt: active.version } })
    .sort({ version: -1 })
    .lean();

  if (!prev) {
    return { ok: false, status: 409, code: 'rollback_unavailable', message: 'No previous version to rollback to' };
  }
  return await setActiveVersion(prev.version);
}

module.exports = {
  getActiveConfig,
  setActiveVersion,
  setActiveVersionToPrevious
};

