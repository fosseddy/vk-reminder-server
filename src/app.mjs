import express from "express";
import cors from "cors";
import * as database from "#src/database.mjs";
import { session } from "#src/vk-session.mjs";
import * as error from "#src/error.mjs";
import * as messages from "#src/messages.mjs";
import * as reminder from "#src/reminder.mjs";

await database.init();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(session);

app.use("/api", messages.router);
app.use("/api", reminder.router);

app.use(error.globalHandler);

setInterval(async () => {
  const conn = database.connection();

  let err = null;
  let query = await conn.execute("select * from schedule").catch(e => err = e);

  if (err) {
    return console.error(err);
  }

  let ids = [];
  for (const r of query[0]) {
    if (Date.now() >= new Date(r.date).getTime()) {
      ids.push(r.reminder_id);
    }
  }

  if (!ids.length) return;

  ids = ids.join(",");

  query = await conn.execute(`select * from reminder where id in (${ids})`)
    .catch(e => err = e);

  if (err) {
    return console.error(err);
  }

  for (const r of query[0]) {
    let err = null;
    const data = await messages.send(r).catch(e => err = e);
    if (err || data.error) {
      console.error("reminder:", r);
      console.error(err);
    }
  }

  await conn.execute(`update reminder set is_done = 1 where id in (${ids})`)
    .catch(e => err = e);

  if (err) {
    return console.error(err);
  }

  await conn.execute(`delete from schedule where reminder_id in (${ids})`)
    .catch(e => err = e);

  if (err) {
    return console.error(err);
  }
}, 10000); // @TODO(art): move to constant?

