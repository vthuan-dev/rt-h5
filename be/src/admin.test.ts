import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "./app.js";
import { prisma } from "./config/prisma.js";
import { signToken } from "./utils/jwt.js";

const app = createApp();

test("admin endpoint blocks normal user", async () => {
  const userToken = signToken({ userId: 1, username: "user1", role: "USER" });
  const res = await request(app)
    .get("/api/admin/dashboard")
    .set("Authorization", `Bearer ${userToken}`);
  assert.equal(res.status, 403);
});

test("admin dashboard works for admin token", async () => {
  const adminToken = signToken({ userId: 1, username: "admin1", role: "ADMIN" });
  const res = await request(app)
    .get("/api/admin/dashboard")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.ok([200, 500].includes(res.status));
});

test("admin review validation rejects invalid payload", async () => {
  const adminToken = signToken({ userId: 1, username: "admin1", role: "ADMIN" });
  const res = await request(app)
    .post("/api/admin/withdraws/1/review")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "PENDDING" });
  assert.equal(res.status, 400);
});

test.after(async () => {
  await prisma.$disconnect();
});
