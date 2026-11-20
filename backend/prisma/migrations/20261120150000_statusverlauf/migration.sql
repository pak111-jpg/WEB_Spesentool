-- CreateTable
CREATE TABLE `StatusAenderung` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `antragId` INTEGER NOT NULL,
    `vonStatus` ENUM('ERFASST', 'EINGEREICHT', 'ZURUECKGEWIESEN', 'GENEHMIGT', 'AUSBEZAHLT', 'ABGELEHNT') NULL,
    `nachStatus` ENUM('ERFASST', 'EINGEREICHT', 'ZURUECKGEWIESEN', 'GENEHMIGT', 'AUSBEZAHLT', 'ABGELEHNT') NOT NULL,
    `zeitpunkt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `rolle` ENUM('MITARBEITENDE', 'VORGESETZTE', 'LOHNBUCHHALTUNG') NOT NULL,
    `begruendung` TEXT NULL,

    INDEX `StatusAenderung_antragId_idx`(`antragId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StatusAenderung` ADD CONSTRAINT `StatusAenderung_antragId_fkey` FOREIGN KEY (`antragId`) REFERENCES `Spesenantrag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatusAenderung` ADD CONSTRAINT `StatusAenderung_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
