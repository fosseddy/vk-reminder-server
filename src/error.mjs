function BadRequest(msg) {
  return {
    error: {
      code: 400,
      message: msg ?? "invalid data"
    }
  };
};

function ServerError(msg) {
  return {
    error: {
      code: 500,
      message: msg ?? "server error"
    }
  };
};

function NotFound(msg) {
  return {
    error: {
      code: 404,
      message: msg ?? "not found"
    }
  };
};

function NotAuthorized(msg) {
  return {
    error: {
      code: 401,
      message: msg ?? "not authorized"
    }
  };
};

function globalHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  return res.status(500).json(ServerError());
}

export {
  BadRequest,
  ServerError,
  NotAuthorized,
  NotFound,
  globalHandler
};
