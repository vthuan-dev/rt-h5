import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import crypto from "crypto";

export type AuthPayload = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN";
};

export type RefreshPayload = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN";
  tokenId: string;
};

export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): AuthPayload =>
  jwt.verify(token, env.JWT_SECRET) as AuthPayload;

export const signRefreshToken = (payload: RefreshPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${env.REFRESH_TOKEN_DAYS}d` });

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, env.JWT_SECRET) as RefreshPayload;

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
