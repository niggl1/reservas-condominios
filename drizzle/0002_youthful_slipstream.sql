ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);