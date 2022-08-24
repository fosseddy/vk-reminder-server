import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { session } from "#src/vk-session.mjs";
import * as error from "#src/error.mjs";
import * as messages from "#src/messages.mjs";
import * as reminder from "#src/reminder.mjs";

export const app = express();

const conn = await mysql.createConnection({
  host: "127.0.0.1",
  database: "vkreminder",
  user: "fosseddy",
  password: "123"
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
