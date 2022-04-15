import express from "express";
import cors from "cors";
import { session } from "#src/vk-session.mjs";
import * as error from "#src/error.mjs";
import * as messages from "#src/messages.mjs";
import * as reminder from "#src/reminder.mjs";

const app = express();

app.use(cors());
app.use(express.json());
app.use(session);

app.use("/api/messages", messages.router);
app.use("/api/reminder", reminder.router);

app.use(error.globalHandler);

export { app };
