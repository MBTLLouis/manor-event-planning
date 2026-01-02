CREATE TABLE `drinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`drinkType` enum('soft','alcoholic') NOT NULL,
	`subType` varchar(100),
	`brandProducer` varchar(255),
	`cocktailName` varchar(255),
	`corkage` enum('client_brings','venue_provides') NOT NULL DEFAULT 'venue_provides',
	`totalQuantity` int NOT NULL,
	`description` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drinks_id` PRIMARY KEY(`id`)
);
