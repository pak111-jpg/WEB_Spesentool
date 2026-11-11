-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `personalnummer` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwortHash` VARCHAR(191) NOT NULL,
    `rolle` ENUM('MITARBEITENDE', 'VORGESETZTE', 'LOHNBUCHHALTUNG') NOT NULL,
    `kostenstelle` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `vorgesetzteId` INTEGER NULL,

    UNIQUE INDEX `User_personalnummer_key`(`personalnummer`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Spesenantrag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jahr` INTEGER NOT NULL,
    `monat` INTEGER NOT NULL,
    `status` ENUM('ERFASST', 'EINGEREICHT', 'ZURUECKGEWIESEN', 'GENEHMIGT', 'AUSBEZAHLT', 'ABGELEHNT') NOT NULL DEFAULT 'ERFASST',
    `mitarbeitendeId` INTEGER NOT NULL,
    `entschiedenVonId` INTEGER NULL,
    `entschiedenAm` DATETIME(3) NULL,
    `begruendung` TEXT NULL,
    `ausbezahltVonId` INTEGER NULL,
    `ausbezahltAm` DATETIME(3) NULL,
    `eingereichtAm` DATETIME(3) NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `geaendertAm` DATETIME(3) NOT NULL,

    INDEX `Spesenantrag_status_idx`(`status`),
    UNIQUE INDEX `Spesenantrag_mitarbeitendeId_jahr_monat_key`(`mitarbeitendeId`, `jahr`, `monat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `antragId` INTEGER NOT NULL,
    `datum` DATE NOT NULL,
    `kategorie` ENUM('FAHRT', 'VERPFLEGUNG', 'UEBERNACHTUNG', 'MATERIAL') NOT NULL,
    `zweck` VARCHAR(191) NOT NULL,
    `kilometer` DECIMAL(8, 1) NULL,
    `betrag` DECIMAL(10, 2) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `geaendertAm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beleg` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `positionId` INTEGER NOT NULL,
    `dateiname` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `groesse` INTEGER NOT NULL,
    `pfad` VARCHAR(191) NOT NULL,
    `hochgeladenAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Beleg_positionId_key`(`positionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_vorgesetzteId_fkey` FOREIGN KEY (`vorgesetzteId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spesenantrag` ADD CONSTRAINT `Spesenantrag_mitarbeitendeId_fkey` FOREIGN KEY (`mitarbeitendeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spesenantrag` ADD CONSTRAINT `Spesenantrag_entschiedenVonId_fkey` FOREIGN KEY (`entschiedenVonId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spesenantrag` ADD CONSTRAINT `Spesenantrag_ausbezahltVonId_fkey` FOREIGN KEY (`ausbezahltVonId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_antragId_fkey` FOREIGN KEY (`antragId`) REFERENCES `Spesenantrag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Beleg` ADD CONSTRAINT `Beleg_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
