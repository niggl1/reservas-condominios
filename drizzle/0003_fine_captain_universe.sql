CREATE TABLE `preferencia_notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`notificarNovaReserva` boolean NOT NULL DEFAULT true,
	`notificarConfirmacao` boolean NOT NULL DEFAULT true,
	`notificarCancelamento` boolean NOT NULL DEFAULT true,
	`notificarLembrete` boolean NOT NULL DEFAULT true,
	`notificarCadastro` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preferencia_notificacoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `preferencia_notificacoes_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`deviceType` varchar(50),
	`deviceName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`)
);
