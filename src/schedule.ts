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

            reminders = reminders.filter(it =>
                Date.now() >= new Date(it.date).getTime()
            );
            if (!reminders.length) return;

            await Promise.all(
                reminders.map(async it => {
                    const res = await messages.send(it);
                    if (res.error) {
                        console.error("send vk message", it, res.error);
                        return;
                    }
                    await db.execute(
                        "UPDATE reminder SET is_done = 1 WHERE id = ?",
                        [it.id]
                    );
                })
            );
        } catch(err) {
            console.error(err);
        }
    }, WATCH_DELAY);
}
