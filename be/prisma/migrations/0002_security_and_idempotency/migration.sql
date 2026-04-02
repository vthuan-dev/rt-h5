CREATE TABLE `RefreshToken` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdIp` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  UNIQUE INDEX `RefreshToken_tokenHash_key`(`tokenHash`),
  INDEX `RefreshToken_userId_expiresAt_idx`(`userId`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NULL,
  `action` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `detail` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `AuditLog_action_createdAt_idx`(`action`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Transaction` ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `Transaction_userId_idempotencyKey_key` ON `Transaction`(`userId`, `idempotencyKey`);

ALTER TABLE `RefreshToken`
  ADD CONSTRAINT `RefreshToken_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
