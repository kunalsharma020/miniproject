const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { logger } = require('./logger');

let memoryServer = null;

function getMemoryBinaryVersion() {
  return process.env.MONGOMS_VERSION || '6.0.15';
}

async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  mongoose.set('strictQuery', true);
  if (!uri || process.env.USE_IN_MEMORY_DB === 'true') {
    memoryServer = await MongoMemoryServer.create({
      binary: { version: getMemoryBinaryVersion() },
    });
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    logger.warn(
      { memUri },
      'Using in-memory MongoDB (set MONGODB_URI to use a real database)'
    );
    return;
  }

  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    if (process.env.DISABLE_IN_MEMORY_FALLBACK === 'true') {
      logger.error(
        { err },
        'MongoDB connection failed (check MONGODB_URI / Atlas IP allowlist)'
      );
      throw err;
    }

    logger.warn(
      { err },
      'MongoDB connection failed, falling back to in-memory MongoDB'
    );
    memoryServer = await MongoMemoryServer.create({
      binary: { version: getMemoryBinaryVersion() },
    });
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    logger.warn(
      { memUri },
      'Using in-memory MongoDB (set DISABLE_IN_MEMORY_FALLBACK=true to disable)'
    );
  }
}

async function disconnectMongo() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectMongo, disconnectMongo };

