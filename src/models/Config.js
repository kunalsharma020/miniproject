const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, index: true, unique: true },
    schemaVersion: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: String, default: 'api' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ConfigSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Config', ConfigSchema);

