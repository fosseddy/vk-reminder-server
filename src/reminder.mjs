import express from "express";
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

const router = express.Router();

router.get("/", async (req, res) => {
  // @TODO(art): validate session
  try {
    const items = await Reminder.find({ userId });
    return res.status(200).json({
      data: { items }
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 500, message: "server error" }
    });
  }
});

export { Reminder, router };
