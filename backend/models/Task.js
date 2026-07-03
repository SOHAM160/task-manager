const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    completed: { type: Boolean, default: false },
    priority: { type: Number, default: 3 },
    status: { type: String, default: "TODO" },
    deadline: { type: Date, default: null },
    burstTime: { type: Number, default: 5 },
    estimatedTime: { type: Number, default: 1 }, // hours, for CPM

    userEmail: { type: String, default: null },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    // Dependency: this task depends on these other tasks
    dependsOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  { timestamps: true }
);

// Virtual for subtasks
taskSchema.virtual("subtasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "parentTaskId",
});

// Virtual for assignee
taskSchema.virtual("assignee", {
  ref: "User",
  localField: "assigneeId",
  foreignField: "_id",
  justOne: true,
});


// Ensure virtuals are included in JSON
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Task", taskSchema);
