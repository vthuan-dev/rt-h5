import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

export type RequestContextRequest = Request & {
  requestId: string;
};

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim() ? incoming : crypto.randomUUID();
  (req as RequestContextRequest).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
