import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { walletRouter } from "./routes/wallet.js";
import { prisma } from "./config/prisma.js";
import { requestContext, type RequestContextRequest } from "./middleware/request-context.js";
import { adminRouter } from "./routes/admin.js";
import { requestLogger } from "./middleware/request-logger.js";

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(requestLogger);
  app.use(helmet());

  const authRateLimit = rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau." },
  });

  const walletRateLimit = rateLimit({
    windowMs: env.WALLET_RATE_LIMIT_WINDOW_MS,
    limit: env.WALLET_RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau." },
  });

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  });

  app.use("/api/auth", authRateLimit, authRouter);
  app.use("/api/wallet", walletRateLimit, walletRouter);
  app.use("/api/admin", adminRouter);

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const reqWithContext = req as RequestContextRequest;
    console.error({ requestId: reqWithContext.requestId, err });
    res.status(500).json({ message: "Đã có lỗi máy chủ xảy ra." });
  });

  return app;
};
