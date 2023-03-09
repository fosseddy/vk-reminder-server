import { Request, Response, NextFunction } from "express";

type AppError = {
    error: {
        code: number;
        message: string;
    }
}

function create(code: number, message: string): AppError {
    return {
        error: { code, message }
    };
}

export const ServerError = create(500, "server error");
export const BadRequest = create(400, "invalid data");
export const NotFound = create(404, "not found");
export const NotAuthorized = create(401, "not authorized");
export const Forbidden = create(403, "forbidden");

export function globalHandler(err: unknown, _: Request, res: Response,
                              next: NextFunction): void {
    if (res.headersSent) {
        next();
        return;
    }

    console.error(err);
    res.status(500).json(ServerError);
}
