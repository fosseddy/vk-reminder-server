import crypto from "crypto";
import * as error from "#src/error.mjs";

function parseHeader(h) {
  const session = {};
  const kvs = h.split("&");

  for (const kv of kvs) {
    const [k, v] = kv.split("=");
    session[k] = v;
  }

  return session;
}

function isValid(session) {
  const { expire, mid, secret, sid, sig, userId } = session;

  if (!expire || !mid || !secret || !sid || !sig || !userId) {
    return false;
  }

  const signature = crypto.createHash("md5")
    .update(
      `expire=${expire}mid=${mid}secret=${secret}` +
      `sid=${sid}${process.env.VK_APP_SECRET}`
    )
    .digest("hex");

  return sig === signature;
}

function session(req, res, next) {
  const header = req.get("VK-Session");

  if (!header) {
    return res.status(401).json(error.NotAuthorized);
  }

  const sess = parseHeader(header);

  if (!isValid(sess)) {
    return res.status(401).json(error.NotAuthorized);
  }

  req.session = sess;
  next();
}

export { session };
