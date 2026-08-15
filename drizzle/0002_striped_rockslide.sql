ALTER TABLE `assignment_submissions` ADD `status` enum('pending','approved','revision') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `reviewComment` text;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `reviewedById` int;