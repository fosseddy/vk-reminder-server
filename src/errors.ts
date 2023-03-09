import { Request, Response, NextFunction } from "express";

type RequestError = {
    error: {
        message: string;
    }
}

export function create(message: string): RequestError {
    return {
        error: { message }
    };
}


export function globalHandler(err: unknown, _: Request, res: Response,
                              next: NextFunction): void {
    if (res.headersSent) {
        next();
        return;
    }

    console.error("error_begin");
    console.error(err);
    console.error("error_end");

    res.status(500).json(create("server error"));
}
