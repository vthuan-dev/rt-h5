import { Router } from "express";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { getRequestId, getRequestIp, getRequestUserAgent } from "../utils/request.js";
import { writeAuditLog } from "../utils/audit.js";

const depositSchema = z.object({
  amount: z.number().int().positive(),
  paymentMethod: z.string().trim().min(2).max(40),
  idempotencyKey: z.string().trim().min(8).max(100),
  note: z.string().trim().max(120).optional(),
});

const withdrawSchema = z.object({
  amount: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(100),
  bankName: z.string().trim().min(2).max(40),
  bankAccount: z.string().trim().min(6).max(40),
  accountHolder: z.string().trim().min(2).max(80),
  note: z.string().trim().max(120).optional(),
});

export const walletRouter = Router();

walletRouter.use(requireAuth);

walletRouter.get("/summary", async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user.userId },
    select: { id: true, username: true, balance: true },
  });

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy người dùng." });
    return;
  }

  res.json(user);
});

walletRouter.post("/deposit", async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) {
    await writeAuditLog({
      userId: authReq.user.userId,
      action: "WALLET_DEPOSIT",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "invalid_payload",
    });
    res.status(400).json({ message: "Dữ liệu nạp tiền không hợp lệ." });
    return;
  }

  const { amount, paymentMethod, note, idempotencyKey } = parsed.data;
  const existed = await prisma.transaction.findFirst({
    where: {
      userId: authReq.user.userId,
      idempotencyKey,
      type: TransactionType.DEPOSIT,
    },
  });
  if (existed) {
    const latestBalance = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { balance: true },
    });
    res.status(200).json({
      message: "Yêu cầu nạp tiền đã được xử lý trước đó.",
      balance: latestBalance?.balance ?? 0,
      transaction: existed,
    });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: authReq.user.userId },
      data: { balance: { increment: amount } },
      select: { id: true, username: true, balance: true },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: authReq.user.userId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.SUCCESS,
        amount,
        idempotencyKey,
        paymentMethod,
        note: note ?? null,
      },
    });

    return { updatedUser, transaction };
  });
  await writeAuditLog({
    userId: authReq.user.userId,
    action: "WALLET_DEPOSIT",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
    detail: `amount=${amount}`,
  });

  res.status(201).json({
    message: "Nạp tiền thành công.",
    balance: result.updatedUser.balance,
    transaction: result.transaction,
  });
});

walletRouter.post("/withdraw", async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);
  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    await writeAuditLog({
      userId: authReq.user.userId,
      action: "WALLET_WITHDRAW",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "invalid_payload",
    });
    res.status(400).json({ message: "Dữ liệu rút tiền không hợp lệ." });
    return;
  }

  const { amount, bankName, bankAccount, accountHolder, note, idempotencyKey } = parsed.data;
  const existed = await prisma.transaction.findFirst({
    where: {
      userId: authReq.user.userId,
      idempotencyKey,
      type: TransactionType.WITHDRAW,
    },
  });
  if (existed) {
    const latestBalance = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: { balance: true },
    });
    res.status(200).json({
      message: "Yêu cầu rút tiền đã được xử lý trước đó.",
      balance: latestBalance?.balance ?? 0,
      transaction: existed,
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: authReq.user.userId },
    select: { balance: true },
  });

  if (!user) {
    await writeAuditLog({
      userId: authReq.user.userId,
      action: "WALLET_WITHDRAW",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "user_not_found",
    });
    res.status(404).json({ message: "Không tìm thấy người dùng." });
    return;
  }

  if (user.balance < amount) {
    await writeAuditLog({
      userId: authReq.user.userId,
      action: "WALLET_WITHDRAW",
      status: "FAILED",
      ip,
      userAgent,
      requestId,
      detail: "insufficient_balance",
    });
    res.status(400).json({ message: "Số dư không đủ để rút." });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: authReq.user.userId },
      data: { balance: { decrement: amount } },
      select: { id: true, username: true, balance: true },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: authReq.user.userId,
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.PENDING,
        amount,
        idempotencyKey,
        bankName,
        bankAccount,
        accountHolder,
        note: note ?? null,
      },
    });

    return { updatedUser, transaction };
  });
  await writeAuditLog({
    userId: authReq.user.userId,
    action: "WALLET_WITHDRAW",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
    detail: `amount=${amount}`,
  });

  res.status(201).json({
    message: "Tạo yêu cầu rút tiền thành công.",
    balance: result.updatedUser.balance,
    transaction: result.transaction,
  });
});

walletRouter.get("/transactions", async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const transactions = await prisma.transaction.findMany({
    where: { userId: authReq.user.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(transactions);
});
