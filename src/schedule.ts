import mysql from "mysql2/promise";
import { Reminder } from "./reminder";
import * as messages from "./messages";

const WATCH_DELAY = 10_000;

export function watch(db: mysql.Connection): NodeJS.Timer {
    return setInterval(async () => {
        try {
            const query = await db.execute(
                "SELECT * FROM reminder WHERE is_done = 0"
            );
            let reminders = query[0] as Reminder[];

            reminders = reminders.filter(
                it => Date.now() >= new Date(it.date).getTime()
            );
            if (!reminders.length) return;

            const successIds: number[] = [];
            for (const r of reminders) {
                const res = await messages.send(r);
                if (res.error) {
                    console.error("send vk message", r, res.error);
                } else {
                    successIds.push(r.id);
                }
            }

            const params = successIds.map(_ => "?").join(",");
            await db.execute(
                `UPDATE reminder SET is_done = 1 WHERE id IN (${params})`,
                successIds
            );
        } catch(err) {
            console.error(err);
        }
    }, WATCH_DELAY);
}
