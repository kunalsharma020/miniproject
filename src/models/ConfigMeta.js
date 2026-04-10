const mongoose = require('mongoose');

const ConfigMetaSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    activeVersion: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConfigMeta', ConfigMetaSchema);

