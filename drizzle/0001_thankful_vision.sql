CREATE TABLE `areas_compartilhadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaPrincipalId` int NOT NULL,
	`areaVinculadaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `areas_compartilhadas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `areas_comuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condominioId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`icone` varchar(100),
	`fotos` json,
	`regras` text,
	`termoAceite` text,
	`valor` decimal(10,2) DEFAULT '0',
	`capacidadeMaxima` int DEFAULT 0,
	`diasMinimoAntecedencia` int DEFAULT 0,
	`diasMaximoAntecedencia` int DEFAULT 30,
	`diasMinimoCancelamento` int DEFAULT 0,
	`limiteReservasPorHorario` int DEFAULT 1,
	`limiteReservasPorDia` int DEFAULT 1,
	`limiteReservasPorSemana` int DEFAULT 0,
	`limiteReservasPorMes` int DEFAULT 0,
	`limiteReservasPorAno` int DEFAULT 0,
	`limiteUnidadePorHorario` int DEFAULT 1,
	`limiteUnidadePorDia` int DEFAULT 1,
	`limiteUnidadePorSemana` int DEFAULT 0,
	`limiteUnidadePorMes` int DEFAULT 0,
	`limiteUnidadePorAno` int DEFAULT 0,
	`limiteMoradorPorHorario` int DEFAULT 1,
	`limiteMoradorPorDia` int DEFAULT 1,
	`limiteMoradorPorSemana` int DEFAULT 0,
	`limiteMoradorPorMes` int DEFAULT 0,
	`limiteMoradorPorAno` int DEFAULT 0,
	`confirmacaoAutomatica` boolean DEFAULT true,
	`permitirMultiplasReservas` boolean DEFAULT false,
	`bloquearAposReserva` boolean DEFAULT false,
	`notificarAgendamento` boolean DEFAULT false,
	`notificarCancelamento` boolean DEFAULT false,
	`linkPagamento` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_comuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condominioId` int NOT NULL,
	`nome` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bloqueios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`tipo` enum('dia_semana','data_especifica') NOT NULL,
	`diasSemana` json,
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`motivo` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bloqueios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `condominios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(10),
	`cnpj` varchar(20),
	`telefone` varchar(20),
	`email` varchar(320),
	`logo` text,
	`administradoraId` int,
	`sindicoId` int,
	`linkCadastro` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `condominios_id` PRIMARY KEY(`id`),
	CONSTRAINT `condominios_linkCadastro_unique` UNIQUE(`linkCadastro`)
);
--> statement-breakpoint
CREATE TABLE `faixas_horario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`horaInicio` varchar(5) NOT NULL,
	`horaFim` varchar(5) NOT NULL,
	`diasSemana` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faixas_horario_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interesses_cancelamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`moradorId` int NOT NULL,
	`dataInteresse` timestamp NOT NULL,
	`horaInicio` varchar(5),
	`horaFim` varchar(5),
	`email` varchar(320) NOT NULL,
	`notificado` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interesses_cancelamento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `limites_globais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condominioId` int NOT NULL,
	`limiteGlobalUnidadePorDia` int DEFAULT 0,
	`limiteGlobalUnidadePorSemana` int DEFAULT 0,
	`limiteGlobalUnidadePorMes` int DEFAULT 0,
	`limiteGlobalUnidadePorAno` int DEFAULT 0,
	`limiteGlobalMoradorPorDia` int DEFAULT 0,
	`limiteGlobalMoradorPorSemana` int DEFAULT 0,
	`limiteGlobalMoradorPorMes` int DEFAULT 0,
	`limiteGlobalMoradorPorAno` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `limites_globais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moradores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`condominioId` int NOT NULL,
	`unidadeId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(20),
	`cpf` varchar(14),
	`tipo` enum('proprietario','inquilino','dependente') DEFAULT 'proprietario',
	`isResponsavel` boolean DEFAULT false,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`isBlocked` boolean NOT NULL DEFAULT false,
	`blockReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moradores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tipo` enum('reserva_criada','reserva_confirmada','reserva_cancelada','cadastro_aprovado','cadastro_rejeitado','cancelamento_disponivel','lembrete') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`mensagem` text,
	`lida` boolean DEFAULT false,
	`reservaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolo` varchar(6) NOT NULL,
	`areaId` int NOT NULL,
	`moradorId` int NOT NULL,
	`unidadeId` int NOT NULL,
	`condominioId` int NOT NULL,
	`dataReserva` timestamp NOT NULL,
	`horaInicio` varchar(5) NOT NULL,
	`horaFim` varchar(5) NOT NULL,
	`quantidadePessoas` int DEFAULT 1,
	`observacoes` text,
	`status` enum('pendente','confirmada','cancelada','utilizada') NOT NULL DEFAULT 'pendente',
	`termoAceito` boolean DEFAULT false,
	`assinaturaDigital` text,
	`dataAceite` timestamp,
	`valorPago` decimal(10,2),
	`statusPagamento` enum('pendente','pago','isento') DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservas_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservas_protocolo_unique` UNIQUE(`protocolo`)
);
--> statement-breakpoint
CREATE TABLE `timeline_acoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservaId` int NOT NULL,
	`userId` int,
	`acao` enum('criada','confirmada','cancelada','utilizada','editada') NOT NULL,
	`descricao` text,
	`perfilUsuario` varchar(50),
	`nomeUsuario` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_acoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`condominioId` int NOT NULL,
	`blocoId` int,
	`numero` varchar(20) NOT NULL,
	`tipo` enum('apartamento','casa','sala','loja') DEFAULT 'apartamento',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','administradora','sindico','morador') NOT NULL DEFAULT 'morador';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isBlocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `blockReason` text;