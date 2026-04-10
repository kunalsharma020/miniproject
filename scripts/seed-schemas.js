require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { connectMongo } = require('../src/utils/mongo');
const { logger } = require('../src/utils/logger');
const SchemaVersion = require('../src/models/SchemaVersion');

async function main() {
  await connectMongo();

  const v1 = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'samples', 'schemas', 'schema.v1.json'), 'utf8')
  );
  const v2 = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'samples', 'schemas', 'schema.v2.json'), 'utf8')
  );

  await SchemaVersion.findOneAndUpdate(
    { version: 'v1' },
    { $set: { version: 'v1', jsonSchema: v1 } },
    { upsert: true, new: true }
  );

  await SchemaVersion.findOneAndUpdate(
    { version: 'v2' },
    { $set: { version: 'v2', jsonSchema: v2, previousVersion: 'v1', migrationKey: 'v1_to_v2' } },
    { upsert: true, new: true }
  );

  logger.info('Seeded schemas v1 and v2');
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exitCode = 1;
});

