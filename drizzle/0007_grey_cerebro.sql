CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`course` enum('starter','main','dessert') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
