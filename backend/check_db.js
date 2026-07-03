const mongoose = require('mongoose');
const Task = require('./models/Task');
const fs = require('fs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/taskmanager');
  const tasks = await Task.find({}).lean();
  const output = tasks.map(t => ({
    id: t._id.toString(),
    title: t.title,
    userId: t.userId ? t.userId.toString() : null,
    workspaceId: t.workspaceId ? t.workspaceId.toString() : null,
    completed: t.completed,
    status: t.status
  }));
  fs.writeFileSync('../tmp/db_output.json', JSON.stringify(output, null, 2));
  await mongoose.disconnect();
  console.log("Written successfully!");
}

run().catch(console.error);
