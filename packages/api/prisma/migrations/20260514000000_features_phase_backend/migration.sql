-- ─── Tickets: nuevas columnas + indices + fulltext + FK subtask ──────────
ALTER TABLE `tickets`
  ADD COLUMN `parentId` VARCHAR(191) NULL,
  ADD COLUMN `firstResponseAt` DATETIME(3) NULL,
  ADD COLUMN `slaFirstResponseBreachedAt` DATETIME(3) NULL,
  ADD COLUMN `slaResolutionBreachedAt` DATETIME(3) NULL;

CREATE INDEX `tickets_dueDate_idx` ON `tickets`(`dueDate`);
CREATE INDEX `tickets_groupId_status_idx` ON `tickets`(`groupId`, `status`);
CREATE INDEX `tickets_parentId_idx` ON `tickets`(`parentId`);
CREATE FULLTEXT INDEX `tickets_title_description_idx` ON `tickets`(`title`, `description`);

ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_parentId_fkey`
  FOREIGN KEY (`parentId`) REFERENCES `tickets`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Notes: indice compuesto + fulltext ─────────────────────────────────
CREATE INDEX `notes_groupId_updatedAt_idx` ON `notes`(`groupId`, `updatedAt`);
CREATE FULLTEXT INDEX `notes_title_content_idx` ON `notes`(`title`, `content`);

-- ─── Attachments: indice por uploader ───────────────────────────────────
CREATE INDEX `attachments_uploadedById_idx` ON `attachments`(`uploadedById`);

-- ─── Notifications ──────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` ENUM('TICKET_ASSIGNED','TICKET_MENTIONED','TICKET_COMMENTED','TICKET_DUE_SOON','REMINDER_DUE','SLA_BREACHED','VAULT_SHARED') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NULL,
  `link` VARCHAR(191) NULL,
  `ticketId` VARCHAR(191) NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `notifications_userId_readAt_idx`(`userId`, `readAt`),
  INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Time entries ───────────────────────────────────────────────────────
CREATE TABLE `time_entries` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `startedAt` DATETIME(3) NOT NULL,
  `endedAt` DATETIME(3) NULL,
  `durationSec` INT NULL,
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `time_entries_ticketId_idx`(`ticketId`),
  INDEX `time_entries_userId_idx`(`userId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `time_entries_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `time_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── SLA policies ───────────────────────────────────────────────────────
CREATE TABLE `sla_policies` (
  `id` VARCHAR(191) NOT NULL,
  `groupId` VARCHAR(191) NULL,
  `priority` ENUM('CRITICAL','URGENT','NORMAL','LOW') NOT NULL,
  `firstResponseMinutes` INT NOT NULL,
  `resolutionMinutes` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE KEY `sla_policies_groupId_priority_key`(`groupId`, `priority`),
  PRIMARY KEY (`id`),
  CONSTRAINT `sla_policies_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Webhooks ───────────────────────────────────────────────────────────
CREATE TABLE `webhooks` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `groupId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `secret` VARCHAR(200) NOT NULL,
  `events` TEXT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastFiredAt` DATETIME(3) NULL,
  `lastStatus` INT NULL,
  `failureCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `webhooks_groupId_idx`(`groupId`),
  INDEX `webhooks_userId_idx`(`userId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `webhooks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `webhooks_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Vault shares ───────────────────────────────────────────────────────
CREATE TABLE `vault_shares` (
  `id` VARCHAR(191) NOT NULL,
  `entryId` VARCHAR(191) NOT NULL,
  `sharedWithUserId` VARCHAR(191) NOT NULL,
  `sharedByUserId` VARCHAR(191) NOT NULL,
  `passwordEncrypted` TEXT NOT NULL,
  `iv` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY `vault_shares_entryId_sharedWithUserId_key`(`entryId`, `sharedWithUserId`),
  INDEX `vault_shares_sharedWithUserId_idx`(`sharedWithUserId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `vault_shares_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `vault_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vault_shares_sharedWithUserId_fkey` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vault_shares_sharedByUserId_fkey` FOREIGN KEY (`sharedByUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
