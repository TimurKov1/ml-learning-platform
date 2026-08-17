ALTER TABLE `assignment_submissions` ADD `awardedScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` ADD `maxScore` int DEFAULT 10 NOT NULL;