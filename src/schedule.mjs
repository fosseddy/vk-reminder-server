import { Model } from "#src/database.mjs";
import { Reminder } from "#src/reminder.mjs";
import * as messages from "#src/messages.mjs";

const WATCH_DELAY = 10_000;

export const Schedule = new Model("schedule");

// @TODO(art): think about what should happen when there is an error
export function watch() {
  return setInterval(async () => {
    let err = null;
    let rows = await Schedule.findAll().catch(e => err = e);
    if (err) {
      return console.error(err);
    }

    console.log("schedule:", rows);

    let ids = [];
    for (const r of rows) {
      if (Date.now() >= new Date(r.date).getTime()) {
        ids.push(r.reminder_id);
      }
    }

    console.log("reminders to send:", ids);

    if (!ids.length) {
      return console.log("--------------------------------------------------");
    }

    err = null;
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

    err = null;
    await Reminder.updateInBy("id", ids, { is_done: 1 }).catch(e => err = e);
    if (err) {
      return console.error(err);
    }

    err = null;
    await Schedule.deleteInBy("reminder_id", ids).catch(e => err = e);
    if (err) {
      return console.error(err);
    }

    console.log("--------------------------------------------------");
  }, WATCH_DELAY);
}
