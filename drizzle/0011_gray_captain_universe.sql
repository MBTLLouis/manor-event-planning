CREATE TABLE `eventPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`guestListEnabled` boolean NOT NULL DEFAULT true,
	`seatingEnabled` boolean NOT NULL DEFAULT true,
	`timelineEnabled` boolean NOT NULL DEFAULT true,
	`menuEnabled` boolean NOT NULL DEFAULT true,
	`notesEnabled` boolean NOT NULL DEFAULT true,
	`hotelEnabled` boolean NOT NULL DEFAULT true,
	`websiteEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD `coupleUsername` varchar(100);--> statement-breakpoint
ALTER TABLE `events` ADD `couplePassword` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_coupleUsername_unique` UNIQUE(`coupleUsername`);