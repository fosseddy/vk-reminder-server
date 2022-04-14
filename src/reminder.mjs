import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema({
  userId: {
    type: String,
    trim: true,
    required: true
  },

  text: {
    type: String,
    trim: true,
    required: true
  },

  date: {
    type: Date,
    min: Date.now,
    required: true
  }
}, { timestamps: true });

const Reminder = mongoose.model("Reminder", ReminderSchema);

export { Reminder };
