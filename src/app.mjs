import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { session } from "#src/vk-session.mjs";
import * as error from "#src/error.mjs";
import * as messages from "#src/messages.mjs";
import * as reminder from "#src/reminder.mjs";

export const app = express();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
}).catch(err => {
  console.error(err);
  process.exit(1);
});

app.set("db", conn);

app.use(cors());
app.use(express.json());
app.use(session);

app.use("/api", messages.router);
app.use("/api", reminder.router);

app.use(error.globalHandler);

setInterval(async () => {
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

  // @TODO(art): send messages
  for (const r of query[0]) {
    console.log(r.id, ":", r.message);
  }

  // @TODO(art): update and delete only succsessfully sent reminders
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

