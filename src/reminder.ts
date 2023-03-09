import express, { Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";
import * as errors from "./errors";

export type Reminder = {
    id: number;
    user_id: string;
    message: string;
    date: number;
}

type RequestBody = {
    message?: string;
    date?: number;
}

export const router = express.Router();
router.use("/reminder", router);
router.get("/", queryAll);
router.post("/", validateBody, create);
router.get("/:id", attachReminder, queryOne);
router.put("/:id", [validateBody, attachReminder], update);
router.delete("/:id", attachReminder, remove);

async function queryAll(req: Request, res: Response,
                        next: NextFunction): Promise<void> {
    const { userId } = req.session;
    const db: mysql.Connection = req.app.get("database");
    try {
        const query = await db.execute(
            "SELECT * FROM reminder WHERE user_id = ?",
            [userId]
        );
        const rows = query[0] as Reminder[];
        res.status(200).json({
            data: { items: rows }
        });
    } catch(err) {
        next(err);
    }
}

async function create(req: Request, res: Response,
                      next: NextFunction): Promise<void> {
    const { message, date } = req.body as RequestBody;
    const { userId } = req.session;
    const db: mysql.Connection = req.app.get("database");
    try {
        const id = await db.execute(
            "INSERT INTO reminder (user_id, message, date) VALUES (?, ?, ?)",
            [userId, message, date]
        );

        res.status(201).json({
            data: { user_id: userId, id, message, date }
        });
    } catch(err) {
        next(err);
    }
}

async function update(req: Request, res: Response,
                      next: NextFunction): Promise<void> {
    const { message, date } = req.body as RequestBody;
    const reminder = req.reminder!;
    const db: mysql.Connection = req.app.get("database");
    try {
        await db.execute(
            "UPDATE reminder SET message = ?, date = ? WHERE id = ?",
            [message, date, reminder.id]
        );

        res.status(200).json({
            data: { ...reminder, message, date }
        });
    } catch(err) {
        next(err);
    }
}

async function remove(req: Request, res: Response,
                      next: NextFunction): Promise<void> {
    const r = req.reminder!;
    const db: mysql.Connection = req.app.get("database");
    try {
        await db.execute("DELETE FROM reminder WHERE id = ?", [r.id]);
        res.status(200).json({ data: r });
    } catch(err) {
        next(err);
    }
}

async function queryOne(req: Request, res: Response): Promise<void> {
    const r = req.reminder!;
    res.status(200).json({ data: r });
}

function validateBody(req: Request, res: Response, next: NextFunction): void {
    const { message, date } = req.body as RequestBody;

    if (!message || !date) {
        res.status(400).json(errors.create("message and date are required"));
        return;
    }

    if (typeof date !== "number") {
        res.status(400).json(errors.create("date must be a number"));
        return;
    }

    if (Date.now() >= date) {
        res.status(400).json(errors.create("date has already passed"));
        return;
    }

    next();
}

async function attachReminder(req: Request, res: Response,
                              next: NextFunction): Promise<void> {
    type ReqParams = { id: string }

    const { id } = req.params as ReqParams;
    const { userId } = req.session;
    const db: mysql.Connection = req.app.get("database");
    try {
        const query = await db.execute(
            "SELECT * FROM reminder WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        const rows = query[0] as Reminder[];
        const r = rows[0];
        if (!r) {
            res.status(404).json(errors.create("reminder does not exist"));
            return;
        }

        req.reminder = r;
        next();
    } catch(err) {
        next(err);
    }
}
