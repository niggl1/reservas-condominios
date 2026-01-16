CREATE TABLE `chaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`condominioId` int NOT NULL,
	`identificacao` varchar(100) NOT NULL,
	`descricao` text,
	`quantidade` int NOT NULL DEFAULT 1,
	`status` enum('disponivel','em_uso','perdida','manutencao') NOT NULL DEFAULT 'disponivel',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chaves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movimentacao_chaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chaveId` int NOT NULL,
	`reservaId` int,
	`moradorId` int NOT NULL,
	`condominioId` int NOT NULL,
	`tipo` enum('retirada','devolucao') NOT NULL,
	`dataHora` timestamp NOT NULL DEFAULT (now()),
	`responsavelId` int NOT NULL,
	`responsavelNome` varchar(255),
	`observacoes` text,
	`fotoDocumento` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `movimentacao_chaves_id` PRIMARY KEY(`id`)
);
