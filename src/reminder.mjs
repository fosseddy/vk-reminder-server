import express from "express";
import mongoose from "mongoose";
import * as error from "#src/error.mjs";

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

router.get("/", async (req, res, next) => {
  const { userId } = req.session;

  let err = null;
  const items = await Reminder.find({ userId }).catch(e => err = e);

  if (err) {
    return next(err);
  }

  return res.status(200).json({
    data: { items }
  });
});

router.post("/", async (req, res, next) => {
  const { text, date } = req.body;
  const { userId } = req.session;

  if (!text || !date) {
    return res.status(400).json(error.BadRequest);
  }

  let err = null;
  let r = new Reminder({ userId, text, date });
  r = await r.save().catch(e => err = e);

  if (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(error.BadRequest);
    }
    return next(err);
  }

  // @TODO(art): schedule reminder

  return res.status(201).json({ data: r });
});

router.put("/:id(\\d+)", findReminder, async (req, res, next) => {
  const { text, date } = req.body;

  if (!text || !date) {
    return res.status(400).json(error.BadRequest);
  }

  let { reminder: r } = req;

  r.text = text;
  r.date = date;

  let err = null;
  r = await r.save().catch(e => err = e);

  if (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(error.BadRequest);
    }
    return next(err);
  }

  // @TODO(art): re-schedule reminder

  return res.status(200).json({ data: r });
});

router.delete("/:id(\\d+)", findReminder, async (req, res, next) => {
  const { reminder: r } = req;

  let err = null;
  r = await r.remove().catch(e => err = e);

  if (err) {
    return next(err);
  }

  // @TODO(art): delete from schedule

  return res.status(200).json({ data: r });
});

router.get("/:id(\\d+)", findReminder, async (req, res, next) => {
  return res.status(200).json({ data: req.reminder });
});

async function findReminder(req, res, next) {
  const { id } = req.params;
  const { userId } = req.session;

  let err = null;
  const r = await Reminder.findById(id).catch(e => err = e);

  if (err) {
    return next(err);
  }

  if (!r) {
    return res.status(400).json(error.BadRequest);
  }

  if (r.userId !== userId) {
    return res.status(403).json(error.Forbidden);
  }

  req.reminder = r;
  return next();
}

export { Reminder, router };
