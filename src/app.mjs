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

setInterval(async () => {
  let err = null;
  let query = await conn.execute("select * from schedule")
    .catch(e => err = e);

  if (err) {
    // @TODO(art): handle error
    console.error(err);
    return;
  }

  let ids = [];
  for (const r of query[0]) {
    if (Date.now() >= new Date(r.date).getTime()) {
      ids.push(r.reminder_id);
    }
  }

  if (!ids.length) return;

  // @TODO(art): clean up naming
  ids = ids.join(",");

  query = await conn.execute(
    `select * from reminder where id in (${ids})`,
  ).catch(e => err = e);

  if (err) {
    // @TODO(art): handle error
    console.error(err);
    return;
  }

  // @TODO(art): send messages
  // @TODO(art): mark reminder as done
  for (const r of query[0]) {
    console.log(r.id, ":", r.message);
  }

  await conn.execute(
    `delete from schedule where reminder_id in (${ids})`,
  ).catch(e => err = e);

  if (err) {
    // @TODO(art): handle error
    console.error(err);
    return;
  }
}, 10000); // @TODO(art): move to constant?

app.set("db", conn);

app.use(cors());
app.use(express.json());
app.use(session);

app.use("/api", messages.router);
app.use("/api", reminder.router);

app.use(error.globalHandler);
