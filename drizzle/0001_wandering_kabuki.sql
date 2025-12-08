CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`coupleName1` varchar(100),
	`coupleName2` varchar(100),
	`eventDate` datetime NOT NULL,
	`eventCode` varchar(50),
	`status` enum('planning','confirmed','completed','cancelled') NOT NULL DEFAULT 'planning',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_eventCode_unique` UNIQUE(`eventCode`)
);
--> statement-breakpoint
CREATE TABLE `floorPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floorPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foodOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`category` enum('starter','main','dessert') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `foodOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`groupName` varchar(100),
	`rsvpStatus` enum('confirmed','pending','declined') NOT NULL DEFAULT 'pending',
	`mealSelection` text,
	`invitationSent` boolean NOT NULL DEFAULT false,
	`dietaryRestrictions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`isUrgent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`floorPlanId` int NOT NULL,
	`tableId` int,
	`seatNumber` int,
	`guestId` int,
	`positionX` int NOT NULL,
	`positionY` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`floorPlanId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`tableType` enum('round','rectangular') NOT NULL,
	`seatCount` int NOT NULL,
	`positionX` int NOT NULL,
	`positionY` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timelineDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` datetime NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timelineDays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timelineEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timelineDayId` int NOT NULL,
	`time` varchar(10) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`assignedTo` varchar(255),
	`notes` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timelineEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','employee','couple') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);