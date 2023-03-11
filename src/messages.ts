import express, { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import { Reminder } from "./reminder";
import * as errors from "./errors";

type VKResponse<T> = {
    response: T;
    error?: { error_msg: string };
}

export const router = express.Router();
router.use("/messages", router);
router.get("/check", checkMessages);

async function checkMessages(req: Request, res: Response,
                             next: NextFunction): Promise<void> {
    const { userId } = req.session;
    try {
        const r = await fetch(
            "https://api.vk.com/method/messages.isMessagesFromGroupAllowed?" +
            `group_id=${process.env.VK_GROUP_ID}&` +
            `user_id=${userId}&` +
            `access_token=${process.env.VK_TOKEN}&` +
            `v=${process.env.VK_API_VER}`
        );

        const data = await r.json() as VKResponse<{ is_allowed: number }>;
        if (data.error) {
            res.status(400).json(errors.create(data.error.error_msg))
            return;
        }

        res.status(200).json({
            data: { allowed: !!data.response.is_allowed }
        });
    } catch(err) {
        next(err);
    }
}

export async function send(r: Reminder): Promise<VKResponse<number>> {
    const { user_id, message } = r;
    const randomId = getRandomInt32();

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

function getRandomInt32(): number {
    const range = 2 ** 32 / 2;
    const min = -range;
    const max = range - 1;
    return Math.floor(Math.random() * (max - min + 1) + min);
}
