require('dotenv').config();
const mongoose = require('mongoose');
const Config = require('../src/models/Config');
const ConfigMeta = require('../src/models/ConfigMeta');
const { connectMongo, disconnectMongo } = require('../src/utils/mongo');

async function seedConfig() {
  await connectMongo();

  // Check if a config already exists
  const existing = await Config.findOne({}).lean();
  if (existing) {
    console.log('Config already seeded, version:', existing.version);
    await disconnectMongo();
    return;
  }

  const doc = await Config.create({
    version: 1,
    schemaVersion: 'v2',
    payload: {
      service: { name: 'billing', port: 3000 },
      features: { flags: { audit: true, export: false } }
    }
  });

  await ConfigMeta.findByIdAndUpdate(
    'singleton',
    { $set: { activeVersion: doc.version } },
    { upsert: true }
  );

  console.log('Seeded initial config, version:', doc.version);
  await disconnectMongo();
}

seedConfig().catch((err) => {
  console.error('Seed config error:', err);
  process.exit(1);
});
