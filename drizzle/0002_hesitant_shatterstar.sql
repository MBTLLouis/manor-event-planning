CREATE TABLE `accommodations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`hotelName` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`website` varchar(500),
	`roomBlockCode` varchar(100),
	`roomRate` int,
	`checkInDate` datetime,
	`checkOutDate` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accommodations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`estimatedCost` int NOT NULL,
	`actualCost` int,
	`paidAmount` int NOT NULL DEFAULT 0,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`vendorId` int,
	`notes` text,
	`dueDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`completed` boolean NOT NULL DEFAULT false,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assignedTo` varchar(255),
	`dueDate` datetime,
	`completedAt` timestamp,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`createdById` int NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`website` varchar(500),
	`status` enum('pending','contacted','booked','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`contractSigned` boolean NOT NULL DEFAULT false,
	`depositPaid` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddingWebsites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`slug` varchar(100),
	`isPublished` boolean NOT NULL DEFAULT false,
	`welcomeMessage` text,
	`ourStory` text,
	`registryLinks` text,
	`rsvpEnabled` boolean NOT NULL DEFAULT true,
	`theme` varchar(50) NOT NULL DEFAULT 'classic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsites_id` PRIMARY KEY(`id`),
	CONSTRAINT `weddingWebsites_eventId_unique` UNIQUE(`eventId`),
	CONSTRAINT `weddingWebsites_slug_unique` UNIQUE(`slug`)
);
