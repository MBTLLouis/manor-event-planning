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
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`coupleName1` varchar(100),
	`coupleName2` varchar(100),
	`eventDate` datetime NOT NULL,
	`eventCode` varchar(50),
	`status` enum('planning','confirmed','completed','cancelled') NOT NULL DEFAULT 'planning',
	`coupleCanView` boolean NOT NULL DEFAULT true,
	`coupleUsername` varchar(100),
	`couplePassword` varchar(255),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_eventCode_unique` UNIQUE(`eventCode`),
	CONSTRAINT `events_coupleUsername_unique` UNIQUE(`coupleUsername`)
);
--> statement-breakpoint
CREATE TABLE `floorPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`mode` enum('ceremony','reception') NOT NULL DEFAULT 'reception',
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
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`groupName` varchar(100),
	`stage` int NOT NULL DEFAULT 1,
	`saveTheDateResponse` enum('yes','no','pending') DEFAULT 'pending',
	`rsvpToken` varchar(64),
	`rsvpStatus` enum('draft','invited','confirmed','declined') NOT NULL DEFAULT 'draft',
	`starterSelection` varchar(255),
	`mainSelection` varchar(255),
	`dessertSelection` varchar(255),
	`hasDietaryRequirements` boolean NOT NULL DEFAULT false,
	`dietaryRestrictions` text,
	`allergySeverity` enum('none','mild','severe') DEFAULT 'none',
	`canOthersConsumeNearby` boolean DEFAULT true,
	`dietaryDetails` text,
	`mealSelection` text,
	`tableAssigned` boolean NOT NULL DEFAULT false,
	`tableId` int,
	`seatId` int,
	`guestType` enum('day','evening','both') DEFAULT 'both',
	`invitationSent` boolean NOT NULL DEFAULT false,
	`foodSelections` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guests_id` PRIMARY KEY(`id`),
	CONSTRAINT `guests_rsvpToken_unique` UNIQUE(`rsvpToken`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`course` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
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
	`name` varchar(255) NOT NULL,
	`eventId` int,
	`tableType` enum('round','rectangular') NOT NULL,
	`seatCount` int NOT NULL,
	`positionX` int NOT NULL DEFAULT 0,
	`positionY` int NOT NULL DEFAULT 0,
	`rotation` int NOT NULL DEFAULT 0,
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','employee','couple') NOT NULL DEFAULT 'user',
	`username` varchar(100),
	`password` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
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
CREATE TABLE `weddingWebsiteFaqItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`websiteId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsiteFaqItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddingWebsitePhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`websiteId` int NOT NULL,
	`photoUrl` varchar(500) NOT NULL,
	`caption` text,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsitePhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddingWebsiteRegistryLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`websiteId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsiteRegistryLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddingWebsiteTimelineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`websiteId` int NOT NULL,
	`time` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsiteTimelineItems_id` PRIMARY KEY(`id`)
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
	`eventDetails` text,
	`travelInfo` text,
	`faqContent` text,
	`dressCode` text,
	`sectionOrder` text DEFAULT ('["welcome","story","eventDetails","travel","faq","dressCode","registry","photos"]'),
	`visibleSections` text DEFAULT ('["welcome","story","registry","photos"]'),
	`rsvpEnabled` boolean NOT NULL DEFAULT true,
	`theme` varchar(50) NOT NULL DEFAULT 'classic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddingWebsites_id` PRIMARY KEY(`id`),
	CONSTRAINT `weddingWebsites_eventId_unique` UNIQUE(`eventId`),
	CONSTRAINT `weddingWebsites_slug_unique` UNIQUE(`slug`)
);
