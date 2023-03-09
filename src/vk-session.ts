import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import * as errors from "./errors";

export type Session = {
    [index: string]: string;

    userId: string;
    expire: string;
    secret: string;
    mid: string;
    sid: string;
    sig: string;
}

function parseHeader(h: string): Session {
    const session: Session = {
        userId: "",
        expire: "",
        secret: "",
        mid: "",
        sid: "",
        sig: ""
    };

    const kvs = h.split("&");
    for (const kv of kvs) {
        const [k, v] = kv.split("=");
        if (!k || !v) continue;
        session[k] = v;
    }

    return session;
}

function isValid(s: Session): boolean {
    const { expire, mid, secret, sid, sig, userId } = s;

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

export function session(req: Request, res: Response,
                        next: NextFunction): void {
    const header = req.get("VK-Session");

    if (!header) {
        res.status(401).json(errors.create("session header is required"));
        return;
    }

    const sess = parseHeader(header);

    if (!isValid(sess)) {
        res.status(401).json(errors.create("session header is invalid"));
        return;
    }

    req.session = sess;
    next();
}
