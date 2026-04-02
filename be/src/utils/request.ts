import type { Request } from "express";
import type { RequestContextRequest } from "../middleware/request-context.js";

export const getRequestIp = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    || req.socket.remoteAddress
    || "unknown";

export const getRequestUserAgent = (req: Request): string =>
  req.header("user-agent") ?? "unknown";

export const getRequestId = (req: Request): string =>
  (req as RequestContextRequest).requestId ?? "unknown";
