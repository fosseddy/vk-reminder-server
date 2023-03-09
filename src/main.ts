import fs from "fs";
import mysql from "mysql2/promise";
import express from "express";
import cors from "cors";
import { session } from "./vk-session";
import * as error from "./error";
import * as messages from "./messages";
import * as reminder from "./reminder";
import * as schedule from "./schedule";

function loadenv(): void {
    const content = fs.readFileSync(".env", { encoding: "utf-8" });
    for (const line of content.trim().split("\n")) {
        let [k, v] = line.split("=");
        if (!k || !v) {
            console.warn(`key or value missing on line: ${line}`);
            continue;
        }
        process.env[k] = v;
    }
}

async function initDatabase(): Promise<mysql.Connection> {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST!,
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!
    });

    await conn.ping();
    return conn;
}

async function main(): Promise<void> {
    loadenv();
    const db = await initDatabase();

    const app = express();
    app.set("database", db);
    app.use(cors());
    app.use(express.json());
    app.use(session);

    app.use("/api", messages.router);
    app.use("/api", reminder.router);

    app.use(error.globalHandler);

    schedule.watch(db);

    const port = process.env.PORT;
    app.listen(port, () => console.log(`Server is listening on port: ${port}`));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

