// Trusted, server-side migrations (no untrusted code execution).
// A migration returns the new config object (and must not mutate input).

function v1_to_v2(oldConfig) {
  // Example migration:
  // v1:
  //  { "serviceName": "x", "port": 3000, "features": ["a","b"] }
  // v2:
  //  { "service": { "name": "x", "port": 3000 }, "features": { "flags": { "a": true, "b": true } } }
  const features = Array.isArray(oldConfig?.features) ? oldConfig.features : [];
  const flags = {};
  for (const f of features) flags[f] = true;

  return {
    service: {
      name: oldConfig?.serviceName,
      port: oldConfig?.port
    },
    features: {
      flags
    }
  };
}

const MIGRATIONS = new Map([
  ['v1_to_v2', { from: 'v1', to: 'v2', fn: v1_to_v2 }]
]);

function getMigrationByKey(key) {
  return MIGRATIONS.get(key) || null;
}

function getMigrationPath(fromVersion, toVersion, schemaDocsByVersion) {
  // Walk forward via previousVersion links (v1 -> v2 -> v3...)
  // Build a list of migration keys to apply.
  const steps = [];
  let current = toVersion;
  const seen = new Set();

  // backtrack from target to source following previousVersion pointers
  while (current && current !== fromVersion) {
    if (seen.has(current)) break;
    seen.add(current);
    const doc = schemaDocsByVersion.get(current);
    if (!doc?.previousVersion) break;
    steps.push({ to: doc.version, from: doc.previousVersion, migrationKey: doc.migrationKey });
    current = doc.previousVersion;
  }

  if (current !== fromVersion) return null;
  steps.reverse();
  return steps;
}

function applyMigrationSteps(config, steps) {
  let out = config;
  for (const step of steps) {
    if (!step.migrationKey) {
      const err = new Error(`No migration available from ${step.from} to ${step.to}`);
      err.statusCode = 409;
      err.code = 'migration_missing';
      throw err;
    }
    const mig = getMigrationByKey(step.migrationKey);
    if (!mig || mig.from !== step.from || mig.to !== step.to) {
      const err = new Error(`Invalid migrationKey for ${step.from} -> ${step.to}`);
      err.statusCode = 409;
      err.code = 'migration_invalid';
      throw err;
    }
    out = mig.fn(out);
  }
  return out;
}

module.exports = {
  getMigrationByKey,
  getMigrationPath,
  applyMigrationSteps
};

