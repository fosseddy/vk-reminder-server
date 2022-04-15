function createError(opts) {
  const { code, message } = opts;
  return {
    error: { code, message }
  };
}

const BadRequest = createError({ code: 400, message: "invalid data" });
const ServerError = createError({ code: 500, message: "server error" });
const NotFound = createError({ code: 404, message: "not found" });
const NotAuthorized = createError({ code: 401, message: "not authorized" });

function globalHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  return res.status(500).json(ServerError);
}

export {
  BadRequest,
  ServerError,
  NotAuthorized,
  NotFound,
  globalHandler
};
