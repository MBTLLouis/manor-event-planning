ALTER TABLE `guests` ADD `stage` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `saveTheDateResponse` enum('yes','no','pending') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `guests` ADD `rsvpToken` varchar(64);--> statement-breakpoint
ALTER TABLE `guests` ADD `starterSelection` varchar(255);--> statement-breakpoint
ALTER TABLE `guests` ADD `mainSelection` varchar(255);--> statement-breakpoint
ALTER TABLE `guests` ADD `dessertSelection` varchar(255);--> statement-breakpoint
ALTER TABLE `guests` ADD CONSTRAINT `guests_rsvpToken_unique` UNIQUE(`rsvpToken`);