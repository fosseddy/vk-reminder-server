import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/check-messages", async (req, res) => {
  const { session } = req.body;
  if (!session) {
    return res.status(401).json({
      error: { code: 401, message: "unauthorized" }
    });
  }

  const { expire, mid, secret, sid, sig } = session;
  if (!expire || !mid || !secret || !sid || !sig) {
    return res.status(401).json({
      error: { code: 401, message: "unauthorized" }
    });
  }

  const signature = crypto.createHash("md5")
    .update(
      `expire=${expire}mid=${mid}secret=${secret}` +
      `sid=${sid}${process.env.VK_APP_SECRET}`
    )
    .digest("hex");

  if (sig !== signature) {
    return res.status(401).json({
      error: { code: 401, message: "unauthorized" }
    });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      error: { code: 400, message: "invalid data" }
    });
  }

  const [data, err] = await isMessagesFromGroupAllowed(userId);
  if (err) {
    console.error(err);
    return res.status(500).json({
      error: { code: 500, message: "server error" }
    });
  }

  if (data.error) {
    console.error(data.error);
    return res.status(400).json({
      error: { code: 400, message: "invalid data" }
    });
  }

  return res.status(200).json({
    data: { allowed: !!data.response.is_allowed }
  });
});

async function isMessagesFromGroupAllowed(userId) {
  try {
    const res = await fetch(
      "https://api.vk.com/method/messages.isMessagesFromGroupAllowed?" +
      `group_id=${process.env.VK_GROUP_ID}&` +
      `user_id=${userId}&` +
      `access_token=${process.env.VK_TOKEN}&` +
      `v=${process.env.VK_API_VER}`
    );

    const data = await res.json();
    return [data, null];
  } catch (err) {
    return [null, err];
  }
}

export { app };
