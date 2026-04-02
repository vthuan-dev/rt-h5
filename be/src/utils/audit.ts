import { prisma } from "../config/prisma.js";

type AuditInput = {
  userId?: number;
  action: string;
  status: "SUCCESS" | "FAILED";
  ip?: string;
  userAgent?: string;
  requestId: string;
  detail?: string;
};

export const writeAuditLog = async (input: AuditInput): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      status: input.status,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId,
      detail: input.detail ?? null,
    },
  });
};
