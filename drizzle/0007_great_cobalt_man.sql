ALTER TABLE `assignment_submissions` ADD `attemptNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `previousAwardedScore` int;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `previousReviewComment` text;