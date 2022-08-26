import express from "express";
import fetch from "node-fetch";
import * as error from "#src/error.mjs";

export const router = express.Router();

router.use("/messages", router);

router.get("/check", async (req, res, next) => {
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
    return res.status(400).json(error.BadRequest);
  }

  return res.status(200).json({
    data: { allowed: !!data.response.is_allowed }
  });
});

export async function send(reminder) {
  const { user_id, message } = reminder;
  const range = 2 ** 32 / 2;
  const min = -range;
  const max = range - 1;
  const randomId = Math.floor(Math.random() * (max - min + 1) + min);
  const res = await fetch(
    "https://api.vk.com/method/messages.send?" +
    `random_id=${randomId}&` +
    `user_id=${user_id}&` +
    `message=${message}&` +
    `access_token=${process.env.VK_TOKEN}&` +
    `v=${process.env.VK_API_VER}`
  );

  return res.json();
}
