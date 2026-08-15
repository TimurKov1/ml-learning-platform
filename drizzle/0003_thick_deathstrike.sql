ALTER TABLE `assignment_submissions` ADD `submittedFileName` varchar(255);--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `submittedFileUrl` varchar(2000);--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `submittedFileKey` varchar(512);--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `autoCheckResult` text;--> statement-breakpoint
ALTER TABLE `assignments` ADD `assignmentType` enum('manual_file','code') DEFAULT 'manual_file' NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` ADD `language` varchar(32);--> statement-breakpoint
ALTER TABLE `assignments` ADD `starterCode` text;--> statement-breakpoint
ALTER TABLE `assignments` ADD `testsJson` text;