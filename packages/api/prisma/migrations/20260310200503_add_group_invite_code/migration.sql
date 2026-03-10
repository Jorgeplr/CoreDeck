-- AlterTable
ALTER TABLE `groups` ADD COLUMN `inviteCode` VARCHAR(10) NOT NULL DEFAULT '';

-- Populate existing rows with unique invite codes (using a UUID-based approach)
UPDATE `groups` SET `inviteCode` = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 6)) WHERE `inviteCode` = '';

-- CreateIndex
CREATE UNIQUE INDEX `groups_inviteCode_key` ON `groups`(`inviteCode`);

-- Remove default after backfill
ALTER TABLE `groups` ALTER COLUMN `inviteCode` DROP DEFAULT;
