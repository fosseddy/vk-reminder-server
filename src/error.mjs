function create(opts) {
  return {
    error: {
      code: opts.code,
      message: opts.message
    }
  };
}

export const BadRequest = create({ code: 400, message: "invalid data" });
export const ServerError = create({ code: 500, message: "server error" });
export const NotFound = create({ code: 404, message: "not found" });
export const NotAuthorized = create({ code: 401, message: "not authorized" });
export const Forbidden = create({ code: 403, message: "forbidden" });

export function globalHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  return res.status(500).json(ServerError);
}
