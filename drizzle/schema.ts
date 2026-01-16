import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ==================== USUÁRIOS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["super_admin", "administradora", "sindico", "morador"]).default("morador").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  blockReason: text("blockReason"),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  emailVerified: boolean("emailVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== CONDOMÍNIOS ====================
export const condominios = mysqlTable("condominios", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  cnpj: varchar("cnpj", { length: 20 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  logo: text("logo"),
  administradoraId: int("administradoraId"),
  sindicoId: int("sindicoId"),
  linkCadastro: varchar("linkCadastro", { length: 100 }).unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Condominio = typeof condominios.$inferSelect;
export type InsertCondominio = typeof condominios.$inferInsert;

// ==================== BLOCOS ====================
export const blocos = mysqlTable("blocos", {
  id: int("id").autoincrement().primaryKey(),
  condominioId: int("condominioId").notNull(),
  nome: varchar("nome", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bloco = typeof blocos.$inferSelect;
export type InsertBloco = typeof blocos.$inferInsert;

// ==================== UNIDADES ====================
export const unidades = mysqlTable("unidades", {
  id: int("id").autoincrement().primaryKey(),
  condominioId: int("condominioId").notNull(),
  blocoId: int("blocoId"),
  numero: varchar("numero", { length: 20 }).notNull(),
  tipo: mysqlEnum("tipo", ["apartamento", "casa", "sala", "loja"]).default("apartamento"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Unidade = typeof unidades.$inferSelect;
export type InsertUnidade = typeof unidades.$inferInsert;

// ==================== MORADORES ====================
export const moradores = mysqlTable("moradores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  condominioId: int("condominioId").notNull(),
  unidadeId: int("unidadeId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  tipo: mysqlEnum("tipo", ["proprietario", "inquilino", "dependente"]).default("proprietario"),
  isResponsavel: boolean("isResponsavel").default(false),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  blockReason: text("blockReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Morador = typeof moradores.$inferSelect;
export type InsertMorador = typeof moradores.$inferInsert;

// ==================== ÁREAS COMUNS ====================
export const areasComuns = mysqlTable("areas_comuns", {
  id: int("id").autoincrement().primaryKey(),
  condominioId: int("condominioId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  icone: varchar("icone", { length: 100 }),
  fotos: json("fotos").$type<string[]>(),
  regras: text("regras"),
  termoAceite: text("termoAceite"),
  valor: decimal("valor", { precision: 10, scale: 2 }).default("0"),
  capacidadeMaxima: int("capacidadeMaxima").default(0),
  
  // Configurações de antecedência
  diasMinimoAntecedencia: int("diasMinimoAntecedencia").default(0),
  diasMaximoAntecedencia: int("diasMaximoAntecedencia").default(30),
  diasMinimoCancelamento: int("diasMinimoCancelamento").default(0),
  
  // Configurações de limites por área
  limiteReservasPorHorario: int("limiteReservasPorHorario").default(1),
  limiteReservasPorDia: int("limiteReservasPorDia").default(1),
  limiteReservasPorSemana: int("limiteReservasPorSemana").default(0),
  limiteReservasPorMes: int("limiteReservasPorMes").default(0),
  limiteReservasPorAno: int("limiteReservasPorAno").default(0),
  
  // Limites por unidade
  limiteUnidadePorHorario: int("limiteUnidadePorHorario").default(1),
  limiteUnidadePorDia: int("limiteUnidadePorDia").default(1),
  limiteUnidadePorSemana: int("limiteUnidadePorSemana").default(0),
  limiteUnidadePorMes: int("limiteUnidadePorMes").default(0),
  limiteUnidadePorAno: int("limiteUnidadePorAno").default(0),
  
  // Limites por morador
  limiteMoradorPorHorario: int("limiteMoradorPorHorario").default(1),
  limiteMoradorPorDia: int("limiteMoradorPorDia").default(1),
  limiteMoradorPorSemana: int("limiteMoradorPorSemana").default(0),
  limiteMoradorPorMes: int("limiteMoradorPorMes").default(0),
  limiteMoradorPorAno: int("limiteMoradorPorAno").default(0),
  
  // Configurações especiais
  confirmacaoAutomatica: boolean("confirmacaoAutomatica").default(true),
  permitirMultiplasReservas: boolean("permitirMultiplasReservas").default(false),
  bloquearAposReserva: boolean("bloquearAposReserva").default(false),
  
  // Notificações
  notificarAgendamento: boolean("notificarAgendamento").default(false),
  notificarCancelamento: boolean("notificarCancelamento").default(false),
  
  // Link para pagamento
  linkPagamento: text("linkPagamento"),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AreaComum = typeof areasComuns.$inferSelect;
export type InsertAreaComum = typeof areasComuns.$inferInsert;

// ==================== FAIXAS DE HORÁRIO ====================
export const faixasHorario = mysqlTable("faixas_horario", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  horaInicio: varchar("horaInicio", { length: 5 }).notNull(), // HH:MM
  horaFim: varchar("horaFim", { length: 5 }).notNull(), // HH:MM
  diasSemana: json("diasSemana").$type<number[]>(), // 0=domingo, 1=segunda, etc
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FaixaHorario = typeof faixasHorario.$inferSelect;
export type InsertFaixaHorario = typeof faixasHorario.$inferInsert;

// ==================== BLOQUEIOS ====================
export const bloqueios = mysqlTable("bloqueios", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  tipo: mysqlEnum("tipo", ["dia_semana", "data_especifica"]).notNull(),
  diasSemana: json("diasSemana").$type<number[]>(), // Para bloqueio por dia da semana
  dataInicio: timestamp("dataInicio"), // Para bloqueio por data específica
  dataFim: timestamp("dataFim"),
  motivo: text("motivo"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bloqueio = typeof bloqueios.$inferSelect;
export type InsertBloqueio = typeof bloqueios.$inferInsert;

// ==================== ÁREAS COMPARTILHADAS ====================
export const areasCompartilhadas = mysqlTable("areas_compartilhadas", {
  id: int("id").autoincrement().primaryKey(),
  areaPrincipalId: int("areaPrincipalId").notNull(),
  areaVinculadaId: int("areaVinculadaId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AreaCompartilhada = typeof areasCompartilhadas.$inferSelect;
export type InsertAreaCompartilhada = typeof areasCompartilhadas.$inferInsert;

// ==================== LIMITES GLOBAIS ====================
export const limitesGlobais = mysqlTable("limites_globais", {
  id: int("id").autoincrement().primaryKey(),
  condominioId: int("condominioId").notNull(),
  
  // Limites globais por unidade (todas as áreas)
  limiteGlobalUnidadePorDia: int("limiteGlobalUnidadePorDia").default(0),
  limiteGlobalUnidadePorSemana: int("limiteGlobalUnidadePorSemana").default(0),
  limiteGlobalUnidadePorMes: int("limiteGlobalUnidadePorMes").default(0),
  limiteGlobalUnidadePorAno: int("limiteGlobalUnidadePorAno").default(0),
  
  // Limites globais por morador (todas as áreas)
  limiteGlobalMoradorPorDia: int("limiteGlobalMoradorPorDia").default(0),
  limiteGlobalMoradorPorSemana: int("limiteGlobalMoradorPorSemana").default(0),
  limiteGlobalMoradorPorMes: int("limiteGlobalMoradorPorMes").default(0),
  limiteGlobalMoradorPorAno: int("limiteGlobalMoradorPorAno").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LimiteGlobal = typeof limitesGlobais.$inferSelect;
export type InsertLimiteGlobal = typeof limitesGlobais.$inferInsert;

// ==================== RESERVAS ====================
export const reservas = mysqlTable("reservas", {
  id: int("id").autoincrement().primaryKey(),
  protocolo: varchar("protocolo", { length: 6 }).notNull().unique(),
  areaId: int("areaId").notNull(),
  moradorId: int("moradorId").notNull(),
  unidadeId: int("unidadeId").notNull(),
  condominioId: int("condominioId").notNull(),
  
  dataReserva: timestamp("dataReserva").notNull(),
  horaInicio: varchar("horaInicio", { length: 5 }).notNull(),
  horaFim: varchar("horaFim", { length: 5 }).notNull(),
  
  quantidadePessoas: int("quantidadePessoas").default(1),
  observacoes: text("observacoes"),
  
  status: mysqlEnum("status", ["pendente", "confirmada", "cancelada", "utilizada"]).default("pendente").notNull(),
  
  // Termo de aceite
  termoAceito: boolean("termoAceito").default(false),
  assinaturaDigital: text("assinaturaDigital"),
  dataAceite: timestamp("dataAceite"),
  
  // Pagamento
  valorPago: decimal("valorPago", { precision: 10, scale: 2 }),
  statusPagamento: mysqlEnum("statusPagamento", ["pendente", "pago", "isento"]).default("pendente"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reserva = typeof reservas.$inferSelect;
export type InsertReserva = typeof reservas.$inferInsert;

// ==================== TIMELINE DE AÇÕES ====================
export const timelineAcoes = mysqlTable("timeline_acoes", {
  id: int("id").autoincrement().primaryKey(),
  reservaId: int("reservaId").notNull(),
  userId: int("userId"),
  acao: mysqlEnum("acao", ["criada", "confirmada", "cancelada", "utilizada", "editada"]).notNull(),
  descricao: text("descricao"),
  perfilUsuario: varchar("perfilUsuario", { length: 50 }),
  nomeUsuario: varchar("nomeUsuario", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimelineAcao = typeof timelineAcoes.$inferSelect;
export type InsertTimelineAcao = typeof timelineAcoes.$inferInsert;

// ==================== INTERESSE EM CANCELAMENTO ====================
export const interessesCancelamento = mysqlTable("interesses_cancelamento", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  moradorId: int("moradorId").notNull(),
  dataInteresse: timestamp("dataInteresse").notNull(),
  horaInicio: varchar("horaInicio", { length: 5 }),
  horaFim: varchar("horaFim", { length: 5 }),
  email: varchar("email", { length: 320 }).notNull(),
  notificado: boolean("notificado").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InteresseCancelamento = typeof interessesCancelamento.$inferSelect;
export type InsertInteresseCancelamento = typeof interessesCancelamento.$inferInsert;

// ==================== PUSH TOKENS ====================
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  deviceType: varchar("deviceType", { length: 50 }),
  deviceName: varchar("deviceName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// ==================== PREFERÊNCIAS DE NOTIFICAÇÃO ====================
export const preferenciaNotificacoes = mysqlTable("preferencia_notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  notificarNovaReserva: boolean("notificarNovaReserva").default(true).notNull(),
  notificarConfirmacao: boolean("notificarConfirmacao").default(true).notNull(),
  notificarCancelamento: boolean("notificarCancelamento").default(true).notNull(),
  notificarLembrete: boolean("notificarLembrete").default(true).notNull(),
  notificarCadastro: boolean("notificarCadastro").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PreferenciaNotificacao = typeof preferenciaNotificacoes.$inferSelect;
export type InsertPreferenciaNotificacao = typeof preferenciaNotificacoes.$inferInsert;

// ==================== NOTIFICAÇÕES ====================
export const notificacoes = mysqlTable("notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["reserva_criada", "reserva_confirmada", "reserva_cancelada", "cadastro_aprovado", "cadastro_rejeitado", "cancelamento_disponivel", "lembrete"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem"),
  lida: boolean("lida").default(false),
  reservaId: int("reservaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;

// ==================== CHAVES ====================
export const chaves = mysqlTable("chaves", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  condominioId: int("condominioId").notNull(),
  identificacao: varchar("identificacao", { length: 100 }).notNull(), // Ex: "Chave 1", "Chave Principal", "Cópia 2"
  descricao: text("descricao"),
  quantidade: int("quantidade").default(1).notNull(),
  status: mysqlEnum("status", ["disponivel", "em_uso", "perdida", "manutencao"]).default("disponivel").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chave = typeof chaves.$inferSelect;
export type InsertChave = typeof chaves.$inferInsert;

// ==================== MOVIMENTAÇÃO DE CHAVES ====================
export const movimentacaoChaves = mysqlTable("movimentacao_chaves", {
  id: int("id").autoincrement().primaryKey(),
  chaveId: int("chaveId").notNull(),
  reservaId: int("reservaId"), // Pode ser vinculada a uma reserva
  moradorId: int("moradorId").notNull(),
  condominioId: int("condominioId").notNull(),
  tipo: mysqlEnum("tipo", ["retirada", "devolucao"]).notNull(),
  dataHora: timestamp("dataHora").defaultNow().notNull(),
  responsavelId: int("responsavelId").notNull(), // Quem entregou/recebeu (porteiro, síndico)
  responsavelNome: varchar("responsavelNome", { length: 255 }), // Nome do responsável
  observacoes: text("observacoes"),
  fotoDocumento: text("fotoDocumento"), // Foto do documento ou assinatura
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MovimentacaoChave = typeof movimentacaoChaves.$inferSelect;
export type InsertMovimentacaoChave = typeof movimentacaoChaves.$inferInsert;

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many }) => ({
  moradores: many(moradores),
  notificacoes: many(notificacoes),
}));

export const condominiosRelations = relations(condominios, ({ one, many }) => ({
  administradora: one(users, {
    fields: [condominios.administradoraId],
    references: [users.id],
  }),
  sindico: one(users, {
    fields: [condominios.sindicoId],
    references: [users.id],
  }),
  blocos: many(blocos),
  unidades: many(unidades),
  moradores: many(moradores),
  areasComuns: many(areasComuns),
  limitesGlobais: many(limitesGlobais),
}));

export const blocosRelations = relations(blocos, ({ one, many }) => ({
  condominio: one(condominios, {
    fields: [blocos.condominioId],
    references: [condominios.id],
  }),
  unidades: many(unidades),
}));

export const unidadesRelations = relations(unidades, ({ one, many }) => ({
  condominio: one(condominios, {
    fields: [unidades.condominioId],
    references: [condominios.id],
  }),
  bloco: one(blocos, {
    fields: [unidades.blocoId],
    references: [blocos.id],
  }),
  moradores: many(moradores),
  reservas: many(reservas),
}));

export const moradoresRelations = relations(moradores, ({ one, many }) => ({
  user: one(users, {
    fields: [moradores.userId],
    references: [users.id],
  }),
  condominio: one(condominios, {
    fields: [moradores.condominioId],
    references: [condominios.id],
  }),
  unidade: one(unidades, {
    fields: [moradores.unidadeId],
    references: [unidades.id],
  }),
  reservas: many(reservas),
}));

export const areasComunsRelations = relations(areasComuns, ({ one, many }) => ({
  condominio: one(condominios, {
    fields: [areasComuns.condominioId],
    references: [condominios.id],
  }),
  faixasHorario: many(faixasHorario),
  bloqueios: many(bloqueios),
  reservas: many(reservas),
}));

export const faixasHorarioRelations = relations(faixasHorario, ({ one }) => ({
  area: one(areasComuns, {
    fields: [faixasHorario.areaId],
    references: [areasComuns.id],
  }),
}));

export const bloqueiosRelations = relations(bloqueios, ({ one }) => ({
  area: one(areasComuns, {
    fields: [bloqueios.areaId],
    references: [areasComuns.id],
  }),
}));

export const reservasRelations = relations(reservas, ({ one, many }) => ({
  area: one(areasComuns, {
    fields: [reservas.areaId],
    references: [areasComuns.id],
  }),
  morador: one(moradores, {
    fields: [reservas.moradorId],
    references: [moradores.id],
  }),
  unidade: one(unidades, {
    fields: [reservas.unidadeId],
    references: [unidades.id],
  }),
  condominio: one(condominios, {
    fields: [reservas.condominioId],
    references: [condominios.id],
  }),
  timeline: many(timelineAcoes),
}));

export const timelineAcoesRelations = relations(timelineAcoes, ({ one }) => ({
  reserva: one(reservas, {
    fields: [timelineAcoes.reservaId],
    references: [reservas.id],
  }),
  user: one(users, {
    fields: [timelineAcoes.userId],
    references: [users.id],
  }),
}));

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  user: one(users, {
    fields: [notificacoes.userId],
    references: [users.id],
  }),
  reserva: one(reservas, {
    fields: [notificacoes.reservaId],
    references: [reservas.id],
  }),
}));

export const chavesRelations = relations(chaves, ({ one, many }) => ({
  area: one(areasComuns, {
    fields: [chaves.areaId],
    references: [areasComuns.id],
  }),
  condominio: one(condominios, {
    fields: [chaves.condominioId],
    references: [condominios.id],
  }),
  movimentacoes: many(movimentacaoChaves),
}));

export const movimentacaoChavesRelations = relations(movimentacaoChaves, ({ one }) => ({
  chave: one(chaves, {
    fields: [movimentacaoChaves.chaveId],
    references: [chaves.id],
  }),
  reserva: one(reservas, {
    fields: [movimentacaoChaves.reservaId],
    references: [reservas.id],
  }),
  morador: one(moradores, {
    fields: [movimentacaoChaves.moradorId],
    references: [moradores.id],
  }),
  condominio: one(condominios, {
    fields: [movimentacaoChaves.condominioId],
    references: [condominios.id],
  }),
  responsavel: one(users, {
    fields: [movimentacaoChaves.responsavelId],
    references: [users.id],
  }),
}));
