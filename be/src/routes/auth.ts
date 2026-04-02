import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import {
  hashToken,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { getRequestId, getRequestIp, getRequestUserAgent } from "../utils/request.js";
import { writeAuditLog } from "../utils/audit.js";

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(6).max(100),
  phone: z.string().trim().min(8).max(20),
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRouter = Router();

const issueAuthTokens = async (
  user: { id: number; username: string; role: "USER" | "ADMIN" },
  req: Request,
) => {
  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    tokenId,
  });
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      createdIp: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
    },
  });
  const accessToken = signToken({ userId: user.id, username: user.username, role: user.role });
  return { accessToken, refreshToken };
};

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);

  if (!parsed.success) {
    await writeAuditLog({
      action: "AUTH_REGISTER",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "invalid_payload",
    });
    res.status(400).json({ message: "Dữ liệu đăng ký không hợp lệ." });
    return;
  }

  const { username, password, phone } = parsed.data;

  const existed = await prisma.user.findFirst({
    where: { OR: [{ username }, { phone }] },
    select: { id: true },
  });

  if (existed) {
    await writeAuditLog({
      action: "AUTH_REGISTER",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "username_or_phone_exists",
    });
    res.status(409).json({ message: "Tên đăng nhập hoặc số điện thoại đã tồn tại." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, phone, passwordHash },
    select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true },
  });

  const issued = await issueAuthTokens(user, req);
  await writeAuditLog({
    userId: user.id,
    action: "AUTH_REGISTER",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
  });
  res.status(201).json({ token: issued.accessToken, refreshToken: issued.refreshToken, user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);

  if (!parsed.success) {
    await writeAuditLog({
      action: "AUTH_LOGIN",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "invalid_payload",
    });
    res.status(400).json({ message: "Dữ liệu đăng nhập không hợp lệ." });
    return;
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    await writeAuditLog({
      action: "AUTH_LOGIN",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "user_not_found",
    });
    res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
    return;
  }

  const passwordMatched = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatched) {
    await writeAuditLog({
      userId: user.id,
      action: "AUTH_LOGIN",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "wrong_password",
    });
    res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
    return;
  }

  const issued = await issueAuthTokens(user, req);
  await writeAuditLog({
    userId: user.id,
    action: "AUTH_LOGIN",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
  });
  res.json({
    token: issued.accessToken,
    refreshToken: issued.refreshToken,
    user: {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
    },
  });
});

authRouter.post("/refresh", async (req, res) => {
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    await writeAuditLog({
      action: "AUTH_REFRESH",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "invalid_payload",
    });
    res.status(400).json({ message: "Dữ liệu làm mới token không hợp lệ." });
    return;
  }

  let payload: { userId: number; username: string; role: "USER" | "ADMIN"; tokenId: string };
  try {
    payload = verifyRefreshToken(parsed.data.refreshToken);
  } catch {
    await writeAuditLog({
      action: "AUTH_REFRESH",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "token_invalid",
    });
    res.status(401).json({ message: "Refresh token không hợp lệ." });
    return;
  }

  const tokenHash = hashToken(parsed.data.refreshToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
    await writeAuditLog({
      userId: payload.userId,
      action: "AUTH_REFRESH",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "token_revoked_or_expired",
    });
    res.status(401).json({ message: "Refresh token đã hết hạn hoặc bị thu hồi." });
    return;
  }

  const refreshUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true },
  });
  if (!refreshUser) {
    res.status(401).json({ message: "Không tìm thấy người dùng cho refresh token." });
    return;
  }

  const issued = await issueAuthTokens(
    { id: refreshUser.id, username: refreshUser.username, role: refreshUser.role },
    req,
  );
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });
  await writeAuditLog({
    userId: payload.userId,
    action: "AUTH_REFRESH",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
  });
  res.json({
    token: issued.accessToken,
    refreshToken: issued.refreshToken,
  });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);
  const authReq = req as AuthenticatedRequest;
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Dữ liệu đăng xuất không hợp lệ." });
    return;
  }

  const tokenHash = hashToken(parsed.data.refreshToken);
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      userId: authReq.user.userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  await writeAuditLog({
    userId: authReq.user.userId,
    action: "AUTH_LOGOUT",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
  });
  res.json({ message: "Đăng xuất thành công." });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user.userId },
    select: { id: true, username: true, phone: true, role: true, balance: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy người dùng." });
    return;
  }

  res.json(user);
});
