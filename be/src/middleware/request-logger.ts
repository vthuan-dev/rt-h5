import type { NextFunction, Request, Response } from "express";
import { getRequestId } from "../utils/request.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(
      JSON.stringify({
        level: "info",
        requestId: getRequestId(req),
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      }),
    );
  });
  next();
};
