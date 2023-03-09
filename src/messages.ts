import express, { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import * as error from "./error";

export const router = express.Router();

router.use("/messages", router);

router.get("/check", async (req: Request, res: Response,
                            next: NextFunction): Promise<void> => {
    const { userId } = req.session;

    try {
        const r = await fetch(
            "https://api.vk.com/method/messages.isMessagesFromGroupAllowed?" +
            `group_id=${process.env.VK_GROUP_ID}&` +
            `user_id=${userId}&` +
            `access_token=${process.env.VK_TOKEN}&` +
            `v=${process.env.VK_API_VER}`
        );

        type Data = {
            response: { is_allowed: number; };
            error: unknown;
        }

        const data = await r.json() as Data;

        if (data.error) {
            res.status(400).json(error.BadRequest);
            return;
        }

        res.status(200).json({
            data: { allowed: !!data.response.is_allowed }
        });
    } catch(err) {
        next(err);
    }
});

//export async function send(reminder) {
//    const { user_id, message } = reminder;
//    const randomId = getRandomInt32();
//
//    const res = await fetch(
//        "https://api.vk.com/method/messages.send?" +
//        `random_id=${randomId}&` +
//        `user_id=${user_id}&` +
//        `message=${message}&` +
//        `access_token=${process.env.VK_TOKEN}&` +
//        `v=${process.env.VK_API_VER}`
//    );
//
//    return res.json();
//}
//
//function getRandomInt32() {
//    const range = 2 ** 32 / 2;
//    const min = -range;
//    const max = range - 1;
//    return Math.floor(Math.random() * (max - min + 1) + min);
//}
