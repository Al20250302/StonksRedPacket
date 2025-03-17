require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  console.log('尝试连接到:', MONGODB_URI?.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:******@'));
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('连接成功!');
    await mongoose.connection.close();
    console.log('连接已关闭');
  } catch (err) {
    console.error('连接失败:', err);
  }
}

testConnection(); 