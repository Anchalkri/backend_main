const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
  content: { type: String, required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Export the Notes model
module.exports = mongoose.model("Notes", notesSchema);
