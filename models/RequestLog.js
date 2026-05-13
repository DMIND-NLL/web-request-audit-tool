const mongoose = require('mongoose');

const RequestLogSchema = new mongoose.Schema({
  ip: { type: String, index: true },
  method: { type: String, index: true },
  path: { type: String, index: true },
  originalUrl: { type: String },
  query: { type: Object, default: {} },
  body: { type: Object, default: {} },
  userAgent: { type: String, default: '' },
  referer: { type: String, default: '' },
  statusCode: { type: Number, index: true },
  responseTime: { type: Number },
  userId: { type: String, default: null },
  riskLevel: {
    type: String,
    enum: ['normal', 'low', 'medium', 'high'],
    default: 'normal',
    index: true
  },
  riskTypes: { type: [String], default: [] },
  riskReasons: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, index: true }
});

RequestLogSchema.index({ createdAt: -1, riskLevel: 1 });
RequestLogSchema.index({ ip: 1, createdAt: -1 });

module.exports = mongoose.model('RequestLog', RequestLogSchema);
