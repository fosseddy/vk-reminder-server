import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { session } from "#src/vk-session.mjs";
import * as reminder from "#src/reminder.mjs";

const app = express();

app.use(cors());
app.use(express.json());

app.use(session);

app.use("/api/reminder", reminder.router);

// @TODO(art): make it GET request
app.post("/api/check-messages", asyncErr(async (req, res) => {
  const { userId } = req.session;

  const r = await fetch(
    "https://api.vk.com/method/messages.isMessagesFromGroupAllowed?" +
    `group_id=${process.env.VK_GROUP_ID}&` +
    `user_id=${userId+"A"}&` +
    `access_token=${process.env.VK_TOKEN}&` +
    `v=${process.env.VK_API_VER}`
  );

  const data = await r.json();

  if (data.error) {
    throw { code: 400, message: "invalid data" }
  }

  return res.status(200).json({
    data: { allowed: !!data.response.is_allowed }
  });
}));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  let error = err.code
    ? err
    : { code: 500, message: "server error" };

  return res.status(error.code).json({ error });
});

function asyncErr(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next);
  }
}

export { app };
