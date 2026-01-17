// Schema para avaliações - será adicionado ao schema.ts principal
import { int, mysqlTable, text, timestamp, boolean, decimal } from "drizzle-orm/mysql-core";

// ==================== AVALIAÇÕES ====================
export const avaliacoes = mysqlTable("avaliacoes", {
  id: int("id").autoincrement().primaryKey(),
  reservaId: int("reservaId").notNull().unique(), // Uma avaliação por reserva
  moradorId: int("moradorId").notNull(),
  areaId: int("areaId").notNull(),
  condominioId: int("condominioId").notNull(),
  
  // Notas (1-5 estrelas)
  notaGeral: int("notaGeral").notNull(), // Nota geral da experiência
  notaLimpeza: int("notaLimpeza"), // Limpeza da área
  notaConservacao: int("notaConservacao"), // Estado de conservação
  notaAtendimento: int("notaAtendimento"), // Atendimento (se aplicável)
  
  // Feedback
  comentario: text("comentario"),
  recomendaria: boolean("recomendaria").default(true),
  
  // Problemas reportados
  problemaReportado: boolean("problemaReportado").default(false),
  descricaoProblema: text("descricaoProblema"),
  
  // Controle
  isPublica: boolean("isPublica").default(true), // Se aparece para outros moradores
  respondida: boolean("respondida").default(false), // Se o síndico respondeu
  respostaSindico: text("respostaSindico"),
  dataResposta: timestamp("dataResposta"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type InsertAvaliacao = typeof avaliacoes.$inferInsert;
