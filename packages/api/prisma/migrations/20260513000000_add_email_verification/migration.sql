-- AlterTable: add email verification fields to users
ALTER TABLE `users`
    ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emailVerifyToken` VARCHAR(200) NULL,
    ADD COLUMN `emailVerifyExpires` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_emailVerifyToken_key` ON `users`(`emailVerifyToken`);
