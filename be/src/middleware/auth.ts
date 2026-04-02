import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    username: string;
    role: "USER" | "ADMIN";
  };
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ message: "Thiếu token xác thực." });
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== "ADMIN") {
    res.status(403).json({ message: "Bạn không có quyền truy cập khu vực quản trị." });
    return;
  }
  next();
};
