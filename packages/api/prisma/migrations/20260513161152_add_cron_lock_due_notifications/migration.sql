-- AlterTable
ALTER TABLE `group_members` MODIFY `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `tickets` ADD COLUMN `dueNotifiedAt` DATETIME(3) NULL,
    ADD COLUMN `templateId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `attachments` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `ticketId` VARCHAR(191) NULL,
    `noteId` VARCHAR(191) NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_ticketId_idx`(`ticketId`),
    INDEX `attachments_noteId_idx`(`noteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NULL,
    `priority` ENUM('CRITICAL', 'URGENT', 'NORMAL', 'LOW') NOT NULL DEFAULT 'NORMAL',
    `scope` ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `groupId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ticket_templates_createdById_idx`(`createdById`),
    INDEX `ticket_templates_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('CRITICAL', 'URGENT', 'NORMAL', 'LOW') NOT NULL DEFAULT 'NORMAL',
    `scope` ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `groupId` VARCHAR(191) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `cronExpr` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastRun` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `recurring_tickets_createdById_idx`(`createdById`),
    INDEX `recurring_tickets_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cron_locks` (
    `name` VARCHAR(191) NOT NULL,
    `lockedUntil` DATETIME(3) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_templates` ADD CONSTRAINT `ticket_templates_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_templates` ADD CONSTRAINT `ticket_templates_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_tickets` ADD CONSTRAINT `recurring_tickets_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_tickets` ADD CONSTRAINT `recurring_tickets_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_tickets` ADD CONSTRAINT `recurring_tickets_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
