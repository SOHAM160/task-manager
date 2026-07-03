const mongoose = require('mongoose');
const Workspace = require('./models/Workspace');
const fs = require('fs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/taskmanager');
  const workspaces = await Workspace.find({}).lean();
  const output = workspaces.map(w => ({
    id: w._id.toString(),
    name: w.name,
    ownerId: w.ownerId ? w.ownerId.toString() : null,
    inviteCode: w.inviteCode
  }));
  fs.writeFileSync('../tmp/workspaces.json', JSON.stringify(output, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
