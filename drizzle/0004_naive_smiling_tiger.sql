ALTER TABLE `floorPlans` ADD `mode` enum('ceremony','reception') DEFAULT 'reception' NOT NULL;--> statement-breakpoint
ALTER TABLE `tables` ADD `rotation` int DEFAULT 0 NOT NULL;