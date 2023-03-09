import mysql from "mysql2/promise";
import { Reminder } from "./reminder";
import * as messages from "./messages";

const WATCH_DELAY = 10_000;

export function watch(db: mysql.Connection): NodeJS.Timer {
    return setInterval(async () => {
        console.log("checking reminders");
        try {
            const query = await db.execute("SELECT * FROM reminder");
            let reminders = query[0] as Reminder[];
            console.log("all", reminders);

            reminders = reminders.filter(
                it => Date.now() >= new Date(it.date).getTime()
            );
            console.log("filtered", reminders);
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
            console.log("successfully sent", successIds);

            const placeholders = successIds.map(_ => "?").join(",");
            await db.execute(
                "UPDATE reminder SET is_done = 1" +
                `WHERE id IN (${placeholders})`,
                successIds
            );
        } catch(err) {
            console.error(err);
        }
    }, WATCH_DELAY);
}
