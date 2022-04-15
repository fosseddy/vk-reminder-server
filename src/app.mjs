import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { session } from "#src/vk-session.mjs";
import * as reminder from "#src/reminder.mjs";
import * as error from "#src/error.mjs";

const app = express();

app.use(cors());
app.use(express.json());

app.use(session);

app.get("/api/check-messages", async (req, res, next) => {
  const { userId } = req.session;

  let err = null;
  const r = await fetch(
    "https://api.vk.com/method/messages.isMessagesFromGroupAllowed?" +
    `group_id=${process.env.VK_GROUP_ID}&` +
    `user_id=${userId}&` +
    `access_token=${process.env.VK_TOKEN}&` +
    `v=${process.env.VK_API_VER}`
  ).catch(e => err = e);

  if (err) {
    return next(err);
  }

  err = null;
  const data = await r.json().catch(e => err = e);

  if (err) {
    return next(err);
  }

  if (data.error) {
    return res.status(400).json(error.BadRequest());
  }

  return res.status(200).json({
    data: { allowed: !!data.response.is_allowed }
  });
});

app.use("/api/reminder", reminder.router);

app.use(error.globalHandler);

export { app };
