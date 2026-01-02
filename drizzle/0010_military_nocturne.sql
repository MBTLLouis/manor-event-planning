CREATE TABLE `accommodationRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`roomName` varchar(100) NOT NULL,
	`roomNumber` int,
	`isAccessible` boolean NOT NULL DEFAULT false,
	`isBlocked` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accommodationRooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roomAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`guestId` int NOT NULL,
	`eventId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roomAllocations_id` PRIMARY KEY(`id`)
);
