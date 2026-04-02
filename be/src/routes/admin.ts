import { Router } from "express";
import { TransactionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { writeAuditLog } from "../utils/audit.js";
import { getRequestId, getRequestIp, getRequestUserAgent } from "../utils/request.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const updateWithdrawSchema = z.object({
  status: z.enum(["SUCCESS", "FAILED"]),
  note: z.string().trim().max(120).optional(),
});

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/withdraws/pending", async (_req, res) => {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "WITHDRAW",
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  res.json(rows);
});

adminRouter.get("/dashboard", async (_req, res) => {
  const [pendingWithdraws, totalUsers, totalDeposits, totalWithdraws] = await Promise.all([
    prisma.transaction.count({ where: { type: "WITHDRAW", status: "PENDING" } }),
    prisma.user.count(),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAW", status: "SUCCESS" },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    pendingWithdraws,
    totalUsers,
    totalDeposits: totalDeposits._sum.amount ?? 0,
    totalWithdraws: totalWithdraws._sum.amount ?? 0,
  });
});

adminRouter.get("/withdraws", async (req, res) => {
  const statusParam = req.query.status;
  const limitParam = Number(req.query.limit ?? 50);
  const cursorParam = Number(req.query.cursor ?? 0);
  const status =
    statusParam === "PENDING" || statusParam === "SUCCESS" || statusParam === "FAILED"
      ? statusParam
      : undefined;

  const rows = await prisma.transaction.findMany({
    where: {
      type: "WITHDRAW",
      ...(status ? { status } : {}),
      ...(cursorParam > 0 ? { id: { lt: cursorParam } } : {}),
    },
    orderBy: { id: "desc" },
    take: Math.min(Math.max(limitParam, 1), 200),
  });
  res.json(rows);
});

adminRouter.get("/users", async (req, res) => {
  const keyword = String(req.query.keyword ?? "").trim();
  const rows = await prisma.user.findMany({
    where: keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { phone: { contains: keyword } },
          ],
        }
      : undefined,
    orderBy: { id: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      phone: true,
      role: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(rows);
});

adminRouter.get("/transactions", async (req, res) => {
  const keyword = String(req.query.keyword ?? "").trim();
  const type = req.query.type === "DEPOSIT" || req.query.type === "WITHDRAW" ? req.query.type : undefined;
  const status =
    req.query.status === "PENDING" || req.query.status === "SUCCESS" || req.query.status === "FAILED"
      ? req.query.status
      : undefined;

  const rows = await prisma.transaction.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { note: { contains: keyword } },
              { bankName: { contains: keyword } },
              { bankAccount: { contains: keyword } },
              { paymentMethod: { contains: keyword } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(rows);
});

adminRouter.get("/audit-logs", async (req, res) => {
  const action = String(req.query.action ?? "").trim();
  const logs = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(logs);
});

adminRouter.post("/withdraws/:id/review", async (req, res) => {
  const requestId = getRequestId(req);
  const ip = getRequestIp(req);
  const userAgent = getRequestUserAgent(req);
  const transactionId = Number(req.params.id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    res.status(400).json({ message: "Mã giao dịch không hợp lệ." });
    return;
  }

  const parsed = updateWithdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Dữ liệu duyệt rút tiền không hợp lệ." });
    return;
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!tx || tx.type !== "WITHDRAW" || tx.status !== "PENDING") {
    res.status(404).json({ message: "Không tìm thấy yêu cầu rút tiền đang chờ duyệt." });
    return;
  }

  const reviewed = await prisma.$transaction(async (trx) => {
    if (parsed.data.status === "FAILED") {
      await trx.user.update({
        where: { id: tx.userId },
        data: { balance: { increment: tx.amount } },
      });
    }

    return trx.transaction.update({
      where: { id: tx.id },
      data: {
        status: parsed.data.status as TransactionStatus,
        note: parsed.data.note ?? tx.note,
      },
    });
  });

  await writeAuditLog({
    userId: tx.userId,
    action: "ADMIN_REVIEW_WITHDRAW",
    status: "SUCCESS",
    ip,
    userAgent,
    requestId,
    detail: `txId=${transactionId},status=${parsed.data.status}`,
  });

  res.json({
    message: "Duyệt giao dịch rút tiền thành công.",
    transaction: reviewed,
  });
});
