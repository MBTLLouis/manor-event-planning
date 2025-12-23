CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `menuItems` MODIFY COLUMN `course` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `foodSelections` json;