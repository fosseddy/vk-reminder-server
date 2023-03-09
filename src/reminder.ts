import express, { Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";
import * as error from "./error";

export type Reminder = {
    id: number;
    user_id: string;
    message: string;
    date: string;
}

type RequestBody = {
    message?: string;
    date?: string;
}

export const router = express.Router();

router.use("/reminder", router);

router.get("/", async (req, res, next) => {
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
});

router.post("/", validateBody, async (req: Request, res: Response,
                                      next: NextFunction): Promise<void> => {
    const { message, date } = req.body as RequestBody;
    const { userId } = req.session;
    const db: mysql.Connection = req.app.get("database");

    try {
        await db.beginTransaction();
        const id = await db.execute(
            "INSERT INTO reminder (user_id, message, date) VALUES (?, ?, ?)",
            [userId, message, date]
        );

        // @Todo(art):
        // await Schedule.create({ reminder_id: insertId, date });
        await db.commit();

        res.status(201).json({
            data: {
                id,
                user_id: userId,
                message,
                date
            }
        });
    } catch(err) {
        await db.rollback();
        next(err);
    }
});

router.put("/:id", [validateBody, findReminder],
           async (req: Request, res: Response,
                  next: NextFunction): Promise<void> => {
    const { message, date } = req.body as RequestBody;
    const reminder = req.reminder!;
    const db: mysql.Connection = req.app.get("database");

    try {
        await db.beginTransaction();

        await db.execute(
            "UPDATE reminder SET message = ?, date = ? WHERE id = ?",
            [message, date, reminder.id]
        );

        // @Todo(art):
        //await Schedule.updateBy("reminder_id", req.reminder.id, { date })

        await db.commit();

        res.status(200).json({
            data: {
                ...reminder,
                message,
                date
            }
        });
    } catch(err) {
        await db.rollback();
        next(err);
    }
});

router.delete("/:id", findReminder,
              async (req: Request, res: Response,
                     next: NextFunction): Promise<void> => {
    const reminder = req.reminder!;
    const db: mysql.Connection = req.app.get("database");

    try {
        await db.beginTransaction();

        await db.execute("DELETE FROM reminder WHERE id = ?", [reminder.id]);

        // @Todo(art):
        //await Schedule.deleteBy("reminder_id", r.id).catch(e => err = e);

        await db.commit();

        res.status(200).json({ data: reminder });
    } catch(err) {
        await db.rollback();
        next(err);
    }
});

router.get("/:id", findReminder, async (req: Request,
                                        res: Response): Promise<void> => {
    const r = req.reminder!;
    res.status(200).json({ data: r });
});

function validateBody(req: Request, res: Response, next: NextFunction): void {
    const { message, date } = req.body as RequestBody;

    if (!message || !date) {
        res.status(400).json(error.BadRequest);
        return;
    }

    const time = new Date(date).getTime();

    if (isNaN(time)) {
        res.status(400).json(error.BadRequest);
        return;
    }

    if (Date.now() >= time) {
        res.status(400).json(error.BadRequest);
        return;
    }

    next();
}

async function findReminder(req: Request, res: Response,
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
            res.status(400).json(error.BadRequest);
            return;
        }

        req.reminder = r;
        next();
    } catch(err) {
        next(err);
    }
}
