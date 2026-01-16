import { eq, and, or, gte, lte, like, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  condominios, InsertCondominio,
  blocos, InsertBloco,
  unidades, InsertUnidade,
  moradores, InsertMorador,
  areasComuns, InsertAreaComum,
  faixasHorario, InsertFaixaHorario,
  bloqueios, InsertBloqueio,
  areasCompartilhadas, InsertAreaCompartilhada,
  limitesGlobais, InsertLimiteGlobal,
  reservas, InsertReserva,
  timelineAcoes, InsertTimelineAcao,
  interessesCancelamento, InsertInteresseCancelamento,
  notificacoes, InsertNotificacao,
  chaves, InsertChave,
  movimentacaoChaves, InsertMovimentacaoChave
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USERS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: 'super_admin' | 'administradora' | 'sindico' | 'morador') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function blockUser(userId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBlocked: true, blockReason: reason }).where(eq(users.id, userId));
}

export async function unblockUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBlocked: false, blockReason: null }).where(eq(users.id, userId));
}

// Funções de autenticação própria
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'super_admin' | 'administradora' | 'sindico' | 'morador';
  loginMethod: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    role: data.role,
    loginMethod: data.loginMethod,
    isActive: true,
    isBlocked: false,
    emailVerified: false,
  });
  
  return {
    id: result[0].insertId,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}

export async function updateUserLastLogin(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function setResetToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ 
    password: hashedPassword, 
    resetToken: null, 
    resetTokenExpiry: null 
  }).where(eq(users.id, userId));
}

// ==================== CONDOMÍNIOS ====================
export async function createCondominio(data: InsertCondominio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const linkCadastro = nanoid(10);
  const result = await db.insert(condominios).values({ ...data, linkCadastro });
  return { id: result[0].insertId, linkCadastro };
}

export async function getCondominioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(condominios).where(eq(condominios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCondominioByLink(link: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(condominios).where(eq(condominios.linkCadastro, link)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCondominios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(condominios).where(eq(condominios.isActive, true)).orderBy(asc(condominios.nome));
}

export async function getCondominiosByAdministradora(administradoraId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(condominios)
    .where(and(eq(condominios.administradoraId, administradoraId), eq(condominios.isActive, true)))
    .orderBy(asc(condominios.nome));
}

export async function getCondominiosBySindico(sindicoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(condominios)
    .where(and(eq(condominios.sindicoId, sindicoId), eq(condominios.isActive, true)))
    .orderBy(asc(condominios.nome));
}

export async function updateCondominio(id: number, data: Partial<InsertCondominio>) {
  const db = await getDb();
  if (!db) return;
  await db.update(condominios).set(data).where(eq(condominios.id, id));
}

export async function deleteCondominio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(condominios).set({ isActive: false }).where(eq(condominios.id, id));
}

export async function getSindicoByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar o condomínio para obter o sindicoId
  const condominio = await db.select().from(condominios).where(eq(condominios.id, condominioId)).limit(1);
  if (!condominio.length || !condominio[0].sindicoId) return null;
  
  // Buscar o usuário síndico
  const sindico = await db.select().from(users).where(eq(users.id, condominio[0].sindicoId)).limit(1);
  if (!sindico.length) return null;
  
  return {
    id: sindico[0].id,
    nome: sindico[0].name,
    email: sindico[0].email,
  };
}

// ==================== BLOCOS ====================
export async function createBloco(data: InsertBloco) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(blocos).values(data);
  return { id: result[0].insertId };
}

export async function getBlocosByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blocos).where(eq(blocos.condominioId, condominioId)).orderBy(asc(blocos.nome));
}

export async function deleteBloco(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blocos).where(eq(blocos.id, id));
}

// ==================== UNIDADES ====================
export async function createUnidade(data: InsertUnidade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(unidades).values(data);
  return { id: result[0].insertId };
}

export async function getUnidadesByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(unidades).where(eq(unidades.condominioId, condominioId)).orderBy(asc(unidades.numero));
}

export async function getUnidadesByBloco(blocoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(unidades).where(eq(unidades.blocoId, blocoId)).orderBy(asc(unidades.numero));
}

export async function deleteUnidade(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(unidades).where(eq(unidades.id, id));
}

// ==================== MORADORES ====================
export async function createMorador(data: InsertMorador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(moradores).values(data);
  return { id: result[0].insertId };
}

export async function getMoradorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moradores).where(eq(moradores.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMoradorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moradores).where(eq(moradores.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMoradoresByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moradores).where(eq(moradores.condominioId, condominioId)).orderBy(asc(moradores.nome));
}

export async function getMoradoresByCondominioComFiltro(
  condominioId: number,
  status?: "pendente" | "aprovado" | "rejeitado"
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(moradores.condominioId, condominioId)];
  if (status) {
    conditions.push(eq(moradores.status, status));
  }
  
  // Retornar com dados da unidade e bloco
  return db.select({
    id: moradores.id,
    userId: moradores.userId,
    condominioId: moradores.condominioId,
    unidadeId: moradores.unidadeId,
    nome: moradores.nome,
    email: moradores.email,
    telefone: moradores.telefone,
    cpf: moradores.cpf,
    tipo: moradores.tipo,
    isResponsavel: moradores.isResponsavel,
    status: moradores.status,
    isBlocked: moradores.isBlocked,
    blockReason: moradores.blockReason,
    createdAt: moradores.createdAt,
    updatedAt: moradores.updatedAt,
    unidade: unidades.numero,
    bloco: blocos.nome,
  })
  .from(moradores)
  .leftJoin(unidades, eq(moradores.unidadeId, unidades.id))
  .leftJoin(blocos, eq(unidades.blocoId, blocos.id))
  .where(and(...conditions))
  .orderBy(asc(moradores.nome));
}

export async function getMoradoresByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moradores).where(eq(moradores.unidadeId, unidadeId)).orderBy(asc(moradores.nome));
}

export async function getMoradoresPendentes(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moradores)
    .where(and(eq(moradores.condominioId, condominioId), eq(moradores.status, 'pendente')))
    .orderBy(desc(moradores.createdAt));
}

export async function aprovarMorador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(moradores).set({ status: 'aprovado' }).where(eq(moradores.id, id));
}

export async function rejeitarMorador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(moradores).set({ status: 'rejeitado' }).where(eq(moradores.id, id));
}

export async function bloquearMorador(id: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(moradores).set({ isBlocked: true, blockReason: reason }).where(eq(moradores.id, id));
}

export async function desbloquearMorador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(moradores).set({ isBlocked: false, blockReason: null }).where(eq(moradores.id, id));
}

export async function updateMorador(id: number, data: Partial<InsertMorador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(moradores).set(data).where(eq(moradores.id, id));
}

export async function deleteMorador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(moradores).where(eq(moradores.id, id));
}

// ==================== ÁREAS COMUNS ====================
export async function createAreaComum(data: InsertAreaComum) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(areasComuns).values(data);
  return { id: result[0].insertId };
}

export async function getAreaComumById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(areasComuns).where(eq(areasComuns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAreasComunsByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(areasComuns)
    .where(and(eq(areasComuns.condominioId, condominioId), eq(areasComuns.isActive, true)))
    .orderBy(asc(areasComuns.nome));
}

export async function updateAreaComum(id: number, data: Partial<InsertAreaComum>) {
  const db = await getDb();
  if (!db) return;
  await db.update(areasComuns).set(data).where(eq(areasComuns.id, id));
}

export async function deleteAreaComum(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(areasComuns).set({ isActive: false }).where(eq(areasComuns.id, id));
}

// ==================== FAIXAS DE HORÁRIO ====================
export async function createFaixaHorario(data: InsertFaixaHorario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(faixasHorario).values(data);
  return { id: result[0].insertId };
}

export async function getFaixasHorarioByArea(areaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faixasHorario)
    .where(and(eq(faixasHorario.areaId, areaId), eq(faixasHorario.isActive, true)))
    .orderBy(asc(faixasHorario.horaInicio));
}

export async function updateFaixaHorario(id: number, data: Partial<InsertFaixaHorario>) {
  const db = await getDb();
  if (!db) return;
  await db.update(faixasHorario).set(data).where(eq(faixasHorario.id, id));
}

export async function deleteFaixaHorario(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(faixasHorario).set({ isActive: false }).where(eq(faixasHorario.id, id));
}

// ==================== BLOQUEIOS ====================
export async function createBloqueio(data: InsertBloqueio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bloqueios).values(data);
  return { id: result[0].insertId };
}

export async function getBloqueiosByArea(areaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bloqueios)
    .where(and(eq(bloqueios.areaId, areaId), eq(bloqueios.isActive, true)));
}

export async function deleteBloqueio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bloqueios).set({ isActive: false }).where(eq(bloqueios.id, id));
}

// ==================== ÁREAS COMPARTILHADAS ====================
export async function createAreaCompartilhada(data: InsertAreaCompartilhada) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(areasCompartilhadas).values(data);
  return { id: result[0].insertId };
}

export async function getAreasCompartilhadas(areaPrincipalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(areasCompartilhadas).where(eq(areasCompartilhadas.areaPrincipalId, areaPrincipalId));
}

export async function deleteAreaCompartilhada(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(areasCompartilhadas).where(eq(areasCompartilhadas.id, id));
}

// ==================== LIMITES GLOBAIS ====================
export async function createLimiteGlobal(data: InsertLimiteGlobal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(limitesGlobais).values(data);
  return { id: result[0].insertId };
}

export async function getLimiteGlobalByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(limitesGlobais).where(eq(limitesGlobais.condominioId, condominioId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLimiteGlobal(id: number, data: Partial<InsertLimiteGlobal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(limitesGlobais).set(data).where(eq(limitesGlobais.id, id));
}

// ==================== RESERVAS ====================
function generateProtocolo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createReserva(data: Omit<InsertReserva, 'protocolo'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const protocolo = generateProtocolo();
  const result = await db.insert(reservas).values({ ...data, protocolo });
  return { id: result[0].insertId, protocolo };
}

export async function getReservaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reservas).where(eq(reservas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReservaByProtocolo(protocolo: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reservas).where(eq(reservas.protocolo, protocolo)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReservasByMorador(moradorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservas).where(eq(reservas.moradorId, moradorId)).orderBy(desc(reservas.dataReserva));
}

export async function getReservasByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservas).where(eq(reservas.unidadeId, unidadeId)).orderBy(desc(reservas.dataReserva));
}

export async function getReservasByArea(areaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservas).where(eq(reservas.areaId, areaId)).orderBy(desc(reservas.dataReserva));
}

export async function getReservasByCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservas).where(eq(reservas.condominioId, condominioId)).orderBy(desc(reservas.dataReserva));
}

export async function getReservasByAreaAndDate(areaId: number, dataReserva: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(dataReserva);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dataReserva);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(reservas)
    .where(and(
      eq(reservas.areaId, areaId),
      gte(reservas.dataReserva, startOfDay),
      lte(reservas.dataReserva, endOfDay)
    ))
    .orderBy(asc(reservas.horaInicio));
}

export async function getReservasPendentes(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservas)
    .where(and(eq(reservas.condominioId, condominioId), eq(reservas.status, 'pendente')))
    .orderBy(desc(reservas.createdAt));
}

export async function confirmarReserva(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservas).set({ status: 'confirmada' }).where(eq(reservas.id, id));
}

export async function cancelarReserva(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservas).set({ status: 'cancelada' }).where(eq(reservas.id, id));
}

export async function marcarReservaUtilizada(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservas).set({ status: 'utilizada' }).where(eq(reservas.id, id));
}

export async function updateReserva(id: number, data: Partial<InsertReserva>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservas).set(data).where(eq(reservas.id, id));
}

export async function searchReservas(condominioId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Search by protocolo
  if (/^\d{6}$/.test(query)) {
    return db.select().from(reservas)
      .where(and(eq(reservas.condominioId, condominioId), eq(reservas.protocolo, query)));
  }
  
  // Search in moradores by name, email, phone
  const moradoresResult = await db.select().from(moradores)
    .where(and(
      eq(moradores.condominioId, condominioId),
      or(
        like(moradores.nome, `%${query}%`),
        like(moradores.email, `%${query}%`),
        like(moradores.telefone, `%${query}%`)
      )
    ));
  
  if (moradoresResult.length > 0) {
    const moradorIds = moradoresResult.map(m => m.id);
    return db.select().from(reservas)
      .where(and(
        eq(reservas.condominioId, condominioId),
        inArray(reservas.moradorId, moradorIds)
      ))
      .orderBy(desc(reservas.dataReserva));
  }
  
  return [];
}

// ==================== TIMELINE ====================
export async function createTimelineAcao(data: InsertTimelineAcao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timelineAcoes).values(data);
  return { id: result[0].insertId };
}

export async function getTimelineByReserva(reservaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timelineAcoes)
    .where(eq(timelineAcoes.reservaId, reservaId))
    .orderBy(asc(timelineAcoes.createdAt));
}

// ==================== INTERESSE EM CANCELAMENTO ====================
export async function createInteresseCancelamento(data: InsertInteresseCancelamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interessesCancelamento).values(data);
  return { id: result[0].insertId };
}

export async function getInteressadosByAreaAndDate(areaId: number, dataInteresse: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(dataInteresse);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dataInteresse);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(interessesCancelamento)
    .where(and(
      eq(interessesCancelamento.areaId, areaId),
      gte(interessesCancelamento.dataInteresse, startOfDay),
      lte(interessesCancelamento.dataInteresse, endOfDay),
      eq(interessesCancelamento.notificado, false)
    ));
}

export async function marcarInteressadosNotificados(ids: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(interessesCancelamento)
    .set({ notificado: true })
    .where(inArray(interessesCancelamento.id, ids));
}

// ==================== NOTIFICAÇÕES ====================
export async function createNotificacao(data: InsertNotificacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notificacoes).values(data);
  return { id: result[0].insertId };
}

export async function getNotificacoesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificacoes)
    .where(eq(notificacoes.userId, userId))
    .orderBy(desc(notificacoes.createdAt));
}

export async function getNotificacoesNaoLidas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificacoes)
    .where(and(eq(notificacoes.userId, userId), eq(notificacoes.lida, false)))
    .orderBy(desc(notificacoes.createdAt));
}

export async function marcarNotificacaoLida(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoes).set({ lida: true }).where(eq(notificacoes.id, id));
}

export async function marcarTodasNotificacoesLidas(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoes).set({ lida: true }).where(eq(notificacoes.userId, userId));
}

// ==================== CONTAGENS PARA LIMITES ====================
export async function countReservasMoradorPeriodo(
  moradorId: number, 
  areaId: number | null, 
  inicio: Date, 
  fim: Date
) {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [
    eq(reservas.moradorId, moradorId),
    gte(reservas.dataReserva, inicio),
    lte(reservas.dataReserva, fim),
    or(eq(reservas.status, 'pendente'), eq(reservas.status, 'confirmada'))
  ];
  
  if (areaId) {
    conditions.push(eq(reservas.areaId, areaId));
  }
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(...conditions));
  
  return result[0]?.count || 0;
}

export async function countReservasUnidadePeriodo(
  unidadeId: number, 
  areaId: number | null, 
  inicio: Date, 
  fim: Date
) {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [
    eq(reservas.unidadeId, unidadeId),
    gte(reservas.dataReserva, inicio),
    lte(reservas.dataReserva, fim),
    or(eq(reservas.status, 'pendente'), eq(reservas.status, 'confirmada'))
  ];
  
  if (areaId) {
    conditions.push(eq(reservas.areaId, areaId));
  }
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(...conditions));
  
  return result[0]?.count || 0;
}

export async function countReservasAreaHorario(
  areaId: number, 
  dataReserva: Date, 
  horaInicio: string, 
  horaFim: string
) {
  const db = await getDb();
  if (!db) return 0;
  
  const startOfDay = new Date(dataReserva);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dataReserva);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(
      eq(reservas.areaId, areaId),
      gte(reservas.dataReserva, startOfDay),
      lte(reservas.dataReserva, endOfDay),
      eq(reservas.horaInicio, horaInicio),
      eq(reservas.horaFim, horaFim),
      or(eq(reservas.status, 'pendente'), eq(reservas.status, 'confirmada'))
    ));
  
  return result[0]?.count || 0;
}

export async function hasReservaNaoUtilizada(moradorId: number, areaId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(
      eq(reservas.moradorId, moradorId),
      eq(reservas.areaId, areaId),
      or(eq(reservas.status, 'pendente'), eq(reservas.status, 'confirmada'))
    ));
  
  return (result[0]?.count || 0) > 0;
}

// ==================== ESTATÍSTICAS ====================
export async function getEstatisticasCondominio(condominioId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const totalMoradores = await db.select({ count: sql<number>`count(*)` })
    .from(moradores)
    .where(and(eq(moradores.condominioId, condominioId), eq(moradores.status, 'aprovado')));
  
  const totalAreas = await db.select({ count: sql<number>`count(*)` })
    .from(areasComuns)
    .where(and(eq(areasComuns.condominioId, condominioId), eq(areasComuns.isActive, true)));
  
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const reservasMes = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(
      eq(reservas.condominioId, condominioId),
      gte(reservas.dataReserva, inicioMes),
      lte(reservas.dataReserva, fimMes)
    ));
  
  const reservasPendentes = await db.select({ count: sql<number>`count(*)` })
    .from(reservas)
    .where(and(eq(reservas.condominioId, condominioId), eq(reservas.status, 'pendente')));
  
  return {
    totalMoradores: totalMoradores[0]?.count || 0,
    totalAreas: totalAreas[0]?.count || 0,
    reservasMes: reservasMes[0]?.count || 0,
    reservasPendentes: reservasPendentes[0]?.count || 0,
  };
}


// ==================== RELATÓRIOS ====================
export async function getReservasParaRelatorio(
  condominioId: number,
  dataInicio: Date,
  dataFim: Date,
  areaId?: number
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(reservas.condominioId, condominioId),
    gte(reservas.dataReserva, dataInicio),
    lte(reservas.dataReserva, dataFim),
  ];
  
  if (areaId) {
    conditions.push(eq(reservas.areaId, areaId));
  }
  
  const result = await db.select({
    id: reservas.id,
    protocolo: reservas.protocolo,
    areaId: reservas.areaId,
    areaNome: areasComuns.nome,
    moradorId: reservas.moradorId,
    moradorNome: moradores.nome,
    unidadeId: reservas.unidadeId,
    unidade: unidades.numero,
    blocoId: unidades.blocoId,
    bloco: blocos.nome,
    dataReserva: reservas.dataReserva,
    horaInicio: reservas.horaInicio,
    horaFim: reservas.horaFim,
    status: reservas.status,
    valor: areasComuns.valor,
    createdAt: reservas.createdAt,
  })
  .from(reservas)
  .leftJoin(areasComuns, eq(reservas.areaId, areasComuns.id))
  .leftJoin(moradores, eq(reservas.moradorId, moradores.id))
  .leftJoin(unidades, eq(reservas.unidadeId, unidades.id))
  .leftJoin(blocos, eq(unidades.blocoId, blocos.id))
  .where(and(...conditions))
  .orderBy(desc(reservas.dataReserva));
  
  return result;
}

export async function getEstatisticasPorArea(
  condominioId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar todas as áreas do condomínio
  const areas = await db.select()
    .from(areasComuns)
    .where(and(eq(areasComuns.condominioId, condominioId), eq(areasComuns.isActive, true)));
  
  const estatisticas = [];
  
  for (const area of areas) {
    const reservasArea = await db.select({
      status: reservas.status,
      valor: areasComuns.valor,
    })
    .from(reservas)
    .leftJoin(areasComuns, eq(reservas.areaId, areasComuns.id))
    .where(and(
      eq(reservas.areaId, area.id),
      gte(reservas.dataReserva, dataInicio),
      lte(reservas.dataReserva, dataFim)
    ));
    
    const totalReservas = reservasArea.length;
    const confirmadas = reservasArea.filter(r => r.status === 'confirmada').length;
    const pendentes = reservasArea.filter(r => r.status === 'pendente').length;
    const canceladas = reservasArea.filter(r => r.status === 'cancelada').length;
    const utilizadas = reservasArea.filter(r => r.status === 'utilizada').length;
    
    // Calcular receita (apenas confirmadas e utilizadas)
    const receitaTotal = reservasArea
      .filter(r => r.status === 'confirmada' || r.status === 'utilizada')
      .reduce((acc, r) => acc + (parseFloat(r.valor || '0')), 0);
    
    // Calcular taxa de ocupação (simplificada)
    // Considera o total de faixas de horário disponíveis no período
    const faixas = await db.select().from(faixasHorario).where(eq(faixasHorario.areaId, area.id));
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const totalSlots = faixas.length * diasPeriodo;
    const taxaOcupacao = totalSlots > 0 ? ((confirmadas + utilizadas) / totalSlots) * 100 : 0;
    
    estatisticas.push({
      areaId: area.id,
      areaNome: area.nome,
      totalReservas,
      reservasConfirmadas: confirmadas,
      reservasPendentes: pendentes,
      reservasCanceladas: canceladas,
      reservasUtilizadas: utilizadas,
      receitaTotal,
      taxaOcupacao: Math.min(taxaOcupacao, 100),
    });
  }
  
  return estatisticas;
}

export async function getEstatisticasPorPeriodo(
  condominioId: number,
  dataInicio: Date,
  dataFim: Date,
  agrupamento: 'dia' | 'semana' | 'mes'
) {
  const db = await getDb();
  if (!db) return [];
  
  const reservasData = await db.select({
    dataReserva: reservas.dataReserva,
    status: reservas.status,
    valor: areasComuns.valor,
  })
  .from(reservas)
  .leftJoin(areasComuns, eq(reservas.areaId, areasComuns.id))
  .where(and(
    eq(reservas.condominioId, condominioId),
    gte(reservas.dataReserva, dataInicio),
    lte(reservas.dataReserva, dataFim)
  ))
  .orderBy(reservas.dataReserva);
  
  // Agrupar por período
  const grupos: Record<string, {
    totalReservas: number;
    reservasConfirmadas: number;
    reservasCanceladas: number;
    receitaTotal: number;
  }> = {};
  
  for (const r of reservasData) {
    let chave: string;
    const data = new Date(r.dataReserva);
    
    if (agrupamento === 'dia') {
      chave = data.toLocaleDateString('pt-BR');
    } else if (agrupamento === 'semana') {
      // Semana do ano
      const inicioAno = new Date(data.getFullYear(), 0, 1);
      const semana = Math.ceil((((data.getTime() - inicioAno.getTime()) / 86400000) + inicioAno.getDay() + 1) / 7);
      chave = `Semana ${semana}/${data.getFullYear()}`;
    } else {
      // Mês
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      chave = `${meses[data.getMonth()]}/${data.getFullYear()}`;
    }
    
    if (!grupos[chave]) {
      grupos[chave] = {
        totalReservas: 0,
        reservasConfirmadas: 0,
        reservasCanceladas: 0,
        receitaTotal: 0,
      };
    }
    
    grupos[chave].totalReservas++;
    if (r.status === 'confirmada' || r.status === 'utilizada') {
      grupos[chave].reservasConfirmadas++;
      grupos[chave].receitaTotal += parseFloat(r.valor || '0');
    }
    if (r.status === 'cancelada') {
      grupos[chave].reservasCanceladas++;
    }
  }
  
  return Object.entries(grupos).map(([periodo, dados]) => ({
    periodo,
    ...dados,
  }));
}

export async function countMoradoresAprovados(condominioId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(moradores)
    .where(and(eq(moradores.condominioId, condominioId), eq(moradores.status, 'aprovado')));
  
  return result[0]?.count || 0;
}

export async function countAreasAtivas(condominioId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(areasComuns)
    .where(and(eq(areasComuns.condominioId, condominioId), eq(areasComuns.isActive, true)));
  
  return result[0]?.count || 0;
}


// ==================== CHAVES ====================
export async function getChaves(
  condominioId: number,
  areaId?: number,
  status?: "disponivel" | "em_uso" | "perdida" | "manutencao"
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(chaves.condominioId, condominioId),
    eq(chaves.isActive, true),
  ];
  
  if (areaId) {
    conditions.push(eq(chaves.areaId, areaId));
  }
  
  if (status) {
    conditions.push(eq(chaves.status, status));
  }
  
  return db.select({
    id: chaves.id,
    areaId: chaves.areaId,
    areaNome: areasComuns.nome,
    condominioId: chaves.condominioId,
    identificacao: chaves.identificacao,
    descricao: chaves.descricao,
    quantidade: chaves.quantidade,
    status: chaves.status,
    isActive: chaves.isActive,
    createdAt: chaves.createdAt,
    updatedAt: chaves.updatedAt,
  })
  .from(chaves)
  .leftJoin(areasComuns, eq(chaves.areaId, areasComuns.id))
  .where(and(...conditions))
  .orderBy(areasComuns.nome, chaves.identificacao);
}

export async function getChaveById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    id: chaves.id,
    areaId: chaves.areaId,
    areaNome: areasComuns.nome,
    condominioId: chaves.condominioId,
    identificacao: chaves.identificacao,
    descricao: chaves.descricao,
    quantidade: chaves.quantidade,
    status: chaves.status,
    isActive: chaves.isActive,
    createdAt: chaves.createdAt,
    updatedAt: chaves.updatedAt,
  })
  .from(chaves)
  .leftJoin(areasComuns, eq(chaves.areaId, areasComuns.id))
  .where(eq(chaves.id, id))
  .limit(1);
  
  return result[0] || null;
}

export async function createChave(data: InsertChave) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chaves).values(data);
  return { id: result[0].insertId };
}

export async function updateChave(id: number, data: Partial<InsertChave>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chaves).set(data).where(eq(chaves.id, id));
  return { success: true };
}

export async function deleteChave(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chaves).set({ isActive: false }).where(eq(chaves.id, id));
  return { success: true };
}

// ==================== MOVIMENTAÇÃO DE CHAVES ====================
export async function createMovimentacaoChave(data: InsertMovimentacaoChave) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(movimentacaoChaves).values(data);
  return { id: result[0].insertId };
}

export async function getHistoricoChaves(params: {
  chaveId?: number;
  condominioId: number;
  moradorId?: number;
  tipo?: "retirada" | "devolucao";
  dataInicio?: Date;
  dataFim?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(movimentacaoChaves.condominioId, params.condominioId)];
  
  if (params.chaveId) {
    conditions.push(eq(movimentacaoChaves.chaveId, params.chaveId));
  }
  
  if (params.moradorId) {
    conditions.push(eq(movimentacaoChaves.moradorId, params.moradorId));
  }
  
  if (params.tipo) {
    conditions.push(eq(movimentacaoChaves.tipo, params.tipo));
  }
  
  if (params.dataInicio) {
    conditions.push(gte(movimentacaoChaves.dataHora, params.dataInicio));
  }
  
  if (params.dataFim) {
    conditions.push(lte(movimentacaoChaves.dataHora, params.dataFim));
  }
  
  return db.select({
    id: movimentacaoChaves.id,
    chaveId: movimentacaoChaves.chaveId,
    chaveIdentificacao: chaves.identificacao,
    areaNome: areasComuns.nome,
    reservaId: movimentacaoChaves.reservaId,
    moradorId: movimentacaoChaves.moradorId,
    moradorNome: moradores.nome,
    tipo: movimentacaoChaves.tipo,
    dataHora: movimentacaoChaves.dataHora,
    responsavelId: movimentacaoChaves.responsavelId,
    responsavelNome: movimentacaoChaves.responsavelNome,
    observacoes: movimentacaoChaves.observacoes,
    createdAt: movimentacaoChaves.createdAt,
  })
  .from(movimentacaoChaves)
  .leftJoin(chaves, eq(movimentacaoChaves.chaveId, chaves.id))
  .leftJoin(areasComuns, eq(chaves.areaId, areasComuns.id))
  .leftJoin(moradores, eq(movimentacaoChaves.moradorId, moradores.id))
  .where(and(...conditions))
  .orderBy(desc(movimentacaoChaves.dataHora));
}

export async function getChavesPendentes(condominioId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar chaves em uso
  const chavesEmUso = await db.select({
    id: chaves.id,
    areaId: chaves.areaId,
    areaNome: areasComuns.nome,
    identificacao: chaves.identificacao,
    status: chaves.status,
  })
  .from(chaves)
  .leftJoin(areasComuns, eq(chaves.areaId, areasComuns.id))
  .where(and(
    eq(chaves.condominioId, condominioId),
    eq(chaves.status, 'em_uso'),
    eq(chaves.isActive, true)
  ));
  
  // Para cada chave em uso, buscar a última movimentação de retirada
  const resultado = [];
  
  for (const chave of chavesEmUso) {
    const ultimaRetirada = await db.select({
      id: movimentacaoChaves.id,
      moradorId: movimentacaoChaves.moradorId,
      moradorNome: moradores.nome,
      moradorUnidade: unidades.numero,
      moradorBloco: blocos.nome,
      dataHora: movimentacaoChaves.dataHora,
      reservaId: movimentacaoChaves.reservaId,
      responsavelNome: movimentacaoChaves.responsavelNome,
    })
    .from(movimentacaoChaves)
    .leftJoin(moradores, eq(movimentacaoChaves.moradorId, moradores.id))
    .leftJoin(unidades, eq(moradores.unidadeId, unidades.id))
    .leftJoin(blocos, eq(unidades.blocoId, blocos.id))
    .where(and(
      eq(movimentacaoChaves.chaveId, chave.id),
      eq(movimentacaoChaves.tipo, 'retirada')
    ))
    .orderBy(desc(movimentacaoChaves.dataHora))
    .limit(1);
    
    if (ultimaRetirada[0]) {
      resultado.push({
        ...chave,
        retirada: ultimaRetirada[0],
      });
    }
  }
  
  return resultado;
}

export async function getRelatorioChaves(condominioId: number) {
  const db = await getDb();
  if (!db) return { resumo: {}, chaves: [], movimentacoes: [] };
  
  // Resumo geral
  const todasChaves = await db.select()
    .from(chaves)
    .where(and(eq(chaves.condominioId, condominioId), eq(chaves.isActive, true)));
  
  const resumo = {
    total: todasChaves.length,
    disponiveis: todasChaves.filter(c => c.status === 'disponivel').length,
    emUso: todasChaves.filter(c => c.status === 'em_uso').length,
    perdidas: todasChaves.filter(c => c.status === 'perdida').length,
    manutencao: todasChaves.filter(c => c.status === 'manutencao').length,
  };
  
  // Lista de chaves com detalhes
  const chavesDetalhadas = await getChaves(condominioId);
  
  // Últimas 50 movimentações
  const ultimasMovimentacoes = await db.select({
    id: movimentacaoChaves.id,
    chaveId: movimentacaoChaves.chaveId,
    chaveIdentificacao: chaves.identificacao,
    areaNome: areasComuns.nome,
    moradorNome: moradores.nome,
    tipo: movimentacaoChaves.tipo,
    dataHora: movimentacaoChaves.dataHora,
    responsavelNome: movimentacaoChaves.responsavelNome,
  })
  .from(movimentacaoChaves)
  .leftJoin(chaves, eq(movimentacaoChaves.chaveId, chaves.id))
  .leftJoin(areasComuns, eq(chaves.areaId, areasComuns.id))
  .leftJoin(moradores, eq(movimentacaoChaves.moradorId, moradores.id))
  .where(eq(movimentacaoChaves.condominioId, condominioId))
  .orderBy(desc(movimentacaoChaves.dataHora))
  .limit(50);
  
  return {
    resumo,
    chaves: chavesDetalhadas,
    movimentacoes: ultimasMovimentacoes,
  };
}
