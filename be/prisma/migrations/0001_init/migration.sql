CREATE TABLE `User` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `balance` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `User_username_key`(`username`),
  UNIQUE INDEX `User_phone_key`(`phone`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Transaction` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `type` ENUM('DEPOSIT', 'WITHDRAW') NOT NULL,
  `amount` INTEGER NOT NULL,
  `status` ENUM('SUCCESS', 'PENDING', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
  `paymentMethod` VARCHAR(191) NULL,
  `bankName` VARCHAR(191) NULL,
  `bankAccount` VARCHAR(191) NULL,
  `accountHolder` VARCHAR(191) NULL,
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Transaction_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Transaction`
  ADD CONSTRAINT `Transaction_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
