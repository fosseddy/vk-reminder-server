import express from "express";
import * as error from "#src/error.mjs";

export const router = express.Router();

router.use("/reminder", router);

router.get("/", async (req, res, next) => {
  const { userId } = req.session;
  const db = req.app.get("db");

  let err = null;
  let query = await db.execute(
    "select * from reminder where user_id = ?",
    [userId]
  ).catch(e => err = e);

  if (err) {
    return next(err);
  }

  return res.status(200).json({
    data: { items: query[0] }
  });
});

router.post("/", async (req, res, next) => {
  const { text, date } = req.body;
  const { userId } = req.session;
  const db = req.app.get("db");

  if (!text || !date) {
    return res.status(400).json(error.BadRequest);
  }

  let err = null;
  const query = await db.execute(
    "insert into reminder (user_id, message, date) values (?, ?, ?)",
    [userId, text, date]
  ).catch(e => err = e);

  if (err) {
    return next(err);
  }

  const newReminder = {
    id: query[0].insertId,
    user_id: userId,
    message: text,
    date
  };

  await db.execute(
    "insert into schedule (reminder_id, date) values (?, ?)",
    [newReminder.id, newReminder.date]
  ).catch(e => err = e);

  if (err) {
    return next(err);
  }

  return res.status(201).json({ data: newReminder });
});

router.put("/:id", findReminder, async (req, res, next) => {
  const { text, date } = req.body;
  const db = req.app.get("db");

  if (!text || !date) {
    return res.status(400).json(error.BadRequest);
  }

  let err = null;
  await db.execute(
    "update reminder set message = ?, date = ? where id = ?",
    [text, date, req.reminder.id]
  ).catch(e => err = e);

  if (err) {
    return next(err);
  }

  await db.execute(
    "update schedule set date = ? where reminder_id = ?",
    [date, req.reminder.id]
  ).catch(e => err = e );

  if (err) {
    return next(err);
  }

  return res.status(200).json({
    data: {
      ...req.reminder,
      message: text,
      date
    }
  });
});

router.delete("/:id", findReminder, async (req, res, next) => {
  let { reminder: r } = req;
  const db = req.app.get("db");

  let err = null;
  await db.execute("delete from reminder where id = ?", [r.id])
    .catch(e => err = e);

  if (err) {
    return next(err);
  }

  // @TODO(art): delete from schedule
  await db.execute("delete from schedule where reminder_id = ?", [r.id])
    .catch(e => err = e);

  if (err) {
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
  const db = req.app.get("db");

  let err = null;
  const query = await db.execute("select * from reminder where id = ?", [id])
    .catch(e => err = e);

  if (err) {
    return next(err);
  }

  const rows = query[0];
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
