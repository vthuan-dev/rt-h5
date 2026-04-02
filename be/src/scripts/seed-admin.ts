import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

const ADMIN_USERNAME = process.env.ADMIN_SEED_USERNAME ?? "admin";
const ADMIN_PHONE = process.env.ADMIN_SEED_PHONE ?? "0900000000";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "admin123456";

const main = async () => {
  const existed = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existed) {
    if (existed.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existed.id },
        data: { role: "ADMIN" },
      });
      console.log(`Updated user ${ADMIN_USERNAME} to ADMIN role.`);
    } else {
      console.log(`Admin user ${ADMIN_USERNAME} already exists.`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      phone: ADMIN_PHONE,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Created admin user ${ADMIN_USERNAME}.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
