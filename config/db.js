const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web_request_audit_tool';

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB 连接成功:', mongoUri);
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
