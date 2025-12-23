ALTER TABLE `guests` MODIFY COLUMN `rsvpStatus` enum('draft','invited','confirmed','declined') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `guests` ADD `firstName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `lastName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `hasDietaryRequirements` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `allergySeverity` enum('none','mild','severe') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `guests` ADD `canOthersConsumeNearby` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `guests` ADD `dietaryDetails` text;--> statement-breakpoint
ALTER TABLE `guests` ADD `tableAssigned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `tableId` int;--> statement-breakpoint
ALTER TABLE `guests` ADD `seatId` int;--> statement-breakpoint
ALTER TABLE `guests` ADD `guestType` enum('day','evening','both') DEFAULT 'both';