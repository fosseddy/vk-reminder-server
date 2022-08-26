import express from "express";
import * as error from "#src/error.mjs";
import * as database from "#src/database.mjs";
import { Schedule } from "#src/schedule.mjs";

export const Reminder = new database.Model("reminder");
export const router = express.Router();

router.use("/reminder", router);

router.get("/", async (req, res, next) => {
  const { userId } = req.session;

  let err = null;
  const rows = await Reminder.findBy("user_id", userId).catch(e => err = e);

  if (err) {
    return next(err);
  }

  return res.status(200).json({
    data: { items: rows }
  });
});

router.post("/", validateBody, async (req, res, next) => {
  const { message, date } = req.body;
  const { userId } = req.session;

  const db = database.connection();

  let err = null;
  await db.beginTransaction().catch(e => err = e);

  if (err) {
    return next(err);
  }

  const insertId = await Reminder.create({ user_id: userId, message, date })
    .catch(e => err = e);;

  if (err) {
    await db.rollback();
    return next(err);
  }

  await Schedule.create({ reminder_id: insertId, date }).catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  await db.commit().catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  return res.status(201).json({
    data: {
      id: insertId,
      user_id: userId,
      message,
      date
    }
  });
});

router.put("/:id", [validateBody, findReminder], async (req, res, next) => {
  const { message, date } = req.body;
  const db = database.connection();

  let err = null;
  await db.beginTransaction().catch(e => err = e);

  if (err) {
    return next(err);
  }

  await Reminder.updateBy("id", req.reminder.id, { message, date })
    .catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  await Schedule.updateBy("reminder_id", req.reminder.id, { date })
    .catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  await db.commit().catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  return res.status(200).json({
    data: {
      ...req.reminder,
      message,
      date
    }
  });
});

router.delete("/:id", findReminder, async (req, res, next) => {
  let { reminder: r } = req;

  const db = database.connection();

  let err = null;
  await db.beginTransaction().catch(e => err = e);;

  if (err) {
    return next(err);
  }

  await Reminder.deleteBy("id", r.id).catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  await Schedule.deleteBy("reminder_id", r.id).catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  await db.commit().catch(e => err = e);

  if (err) {
    await db.rollback();
    return next(err);
  }

  return res.status(200).json({ data: r });
});

router.get("/:id", findReminder, async (req, res, next) => {
  return res.status(200).json({ data: req.reminder });
});

async function findReminder(req, res, next) {
  const { id } = req.params;
  const { userId } = req.session;

  let err = null;
  const rows = await Reminder.findBy("id", id).catch(e => err = e);

  if (err) {
    return next(err);
  }

  if (!rows.length) {
    return res.status(400).json(error.BadRequest);
  }

  const r = rows[0];
  if (r.user_id !== userId) {
    return res.status(403).json(error.Forbidden);
  }

  req.reminder = r;
  return next();
}

function validateBody(req, res, next) {
  const { message, date } = req.body;

  if (!message || !date) {
    return res.status(400).json(error.BadRequest);
  }

  const time = new Date(date).getTime();

  if (isNaN(time)) {
    return res.status(400).json(error.BadRequest);
  }

  if (Date.now() >= time) {
    return res.status(400).json(error.BadRequest);
  }

  return next();
}
