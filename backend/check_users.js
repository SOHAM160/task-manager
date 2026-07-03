const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/taskmanager');
  const users = await User.find({}).lean();
  const output = users.map(u => ({
    id: u._id.toString(),
    email: u.email
  }));
  fs.writeFileSync('../tmp/users.json', JSON.stringify(output, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
