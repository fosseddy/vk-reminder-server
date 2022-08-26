import { Reminder } from "#src/reminder.mjs";
import * as database from "#src/database.mjs";
import * as messages from "#src/messages.mjs";

const WATCH_DELAY = 10_000;

export const Schedule = new database.Model("schedule");

export function watch() {
  return setInterval(async () => {
    let err = null;
    let rows = await Schedule.findAll().catch(e => err = e);

    if (err) {
      return console.error(err);
    }

    const ids = [];
    for (const r of rows) {
      if (Date.now() >= new Date(r.date).getTime()) {
        ids.push(r.reminder_id);
      }
    }

    if (!ids.length) return;

    rows = await Reminder.findInBy("id", ids).catch(e => err = e);

    if (err) {
      return console.error(err);
    }

    for (const r of rows) {
      let err = null;
      const data = await messages.send(r).catch(e => err = e);
      if (err || data.error) {
        console.error("reminder:", r);
        console.error(err);
      }
    }

    const db = database.connection();
    await db.beginTransaction().catch(e => err = e);

    if (err) {
      return console.error(err);
    }

    let err1 = null;
    let err2 = null;
    await Promise.all([
      Reminder.updateInBy("id", ids, { is_done: 1 }),
      Schedule.deleteInBy("reminder_id", ids)
    ]).catch(errors => [err1, err2] = errors);

    if (err1 || err2) {
      await db.rollback();
      return console.error(err1, err2);
    }

    await db.commit().catch(e => err = e);

    if (err) {
      await db.rollback();
      return console.error(err);
    }

    console.log("--------------------------------------------------");
  }, WATCH_DELAY);
}
