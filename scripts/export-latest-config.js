require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { connectMongo } = require('../src/utils/mongo');
const { logger } = require('../src/utils/logger');
const { getActiveConfig } = require('../src/services/configVersioning');

async function main() {
  await connectMongo();
  const cfg = await getActiveConfig();
  if (!cfg) {
    throw new Error('No config found to export');
  }

  const outDir = path.join(__dirname, '..', 'deploy');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'config.json');

  fs.writeFileSync(outPath, JSON.stringify(cfg.payload, null, 2), 'utf8');

  // Unix file permissions: make read-only (444) where supported
  if (process.platform !== 'win32') {
    fs.chmodSync(outPath, 0o444);
  }

  logger.info({ outPath, version: cfg.version, schemaVersion: cfg.schemaVersion }, 'Exported active config');
}

main().catch((err) => {
  logger.error({ err }, 'Export failed');
  process.exitCode = 1;
});

