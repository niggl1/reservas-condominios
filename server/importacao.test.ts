import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo db
vi.mock("./db", () => ({
  getAllCondominios: vi.fn(),
  getCondominiosByAdministradora: vi.fn(),
  getCondominiosBySindico: vi.fn(),
  getCondominioById: vi.fn(),
  getCondominioByLink: vi.fn(),
  createCondominio: vi.fn(),
  updateCondominio: vi.fn(),
  deleteCondominio: vi.fn(),
  getEstatisticasCondominio: vi.fn(),
  getBlocosByCondominio: vi.fn(),
  getUnidadesByBloco: vi.fn(),
  createBloco: vi.fn(),
  updateBloco: vi.fn(),
  deleteBloco: vi.fn(),
  getUnidadesByCondominio: vi.fn(),
  createUnidade: vi.fn(),
  updateUnidade: vi.fn(),
  deleteUnidade: vi.fn(),
  getMoradoresByCondominio: vi.fn(),
  getMoradoresByUnidade: vi.fn(),
  getMoradoresPendentes: vi.fn(),
  getMoradorById: vi.fn(),
  getMoradorByUserId: vi.fn(),
  createMorador: vi.fn(),
  updateMorador: vi.fn(),
  aprovarMorador: vi.fn(),
  rejeitarMorador: vi.fn(),
  bloquearMorador: vi.fn(),
  desbloquearMorador: vi.fn(),
  deleteMorador: vi.fn(),
  getAreasComunsByCondominio: vi.fn(),
  getAreaComumById: vi.fn(),
  createAreaComum: vi.fn(),
  updateAreaComum: vi.fn(),
  deleteAreaComum: vi.fn(),
  getFaixasHorarioByArea: vi.fn(),
  createFaixaHorario: vi.fn(),
  updateFaixaHorario: vi.fn(),
  deleteFaixaHorario: vi.fn(),
  getReservasByCondominio: vi.fn(),
  getReservasByArea: vi.fn(),
  getReservasByMorador: vi.fn(),
  getReservaById: vi.fn(),
  getReservaByProtocolo: vi.fn(),
  createReserva: vi.fn(),
  updateReserva: vi.fn(),
  confirmarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  deleteReserva: vi.fn(),
  getTimelineByReserva: vi.fn(),
  addTimelineEntry: vi.fn(),
  getBloqueiosByArea: vi.fn(),
  createBloqueio: vi.fn(),
  deleteBloqueio: vi.fn(),
  getAreasCompartilhadas: vi.fn(),
  createAreaCompartilhada: vi.fn(),
  deleteAreaCompartilhada: vi.fn(),
  getLimitesGlobais: vi.fn(),
  updateLimitesGlobais: vi.fn(),
  searchReservas: vi.fn(),
  getInteressadosCancelamento: vi.fn(),
  addInteressadoCancelamento: vi.fn(),
  removeInteressadoCancelamento: vi.fn(),
  getTermoAceiteByArea: vi.fn(),
  getAssinaturasByMorador: vi.fn(),
  createAssinatura: vi.fn(),
  getAllUsers: vi.fn(),
  getUsersByCondominio: vi.fn(),
  updateUserRole: vi.fn(),
  getEstatisticasRelatorio: vi.fn(),
  getReservasRelatorio: vi.fn(),
  getEstatisticasPorArea: vi.fn(),
  getEstatisticasPorPeriodo: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "super_admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Importação de Moradores via Excel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validarImportacao", () => {
    it("deve validar dados corretos com sucesso", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Mock dos blocos e unidades
      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, condominioId: 1, nome: "B", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockImplementation(async (blocoId) => {
        if (blocoId === 1) {
          return [
            { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
            { id: 2, blocoId: 1, numero: "102", createdAt: new Date(), updatedAt: new Date() },
          ];
        }
        return [
          { id: 3, blocoId: 2, numero: "201", createdAt: new Date(), updatedAt: new Date() },
        ];
      });

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "101" },
          { linha: 3, nome: "Maria Santos", email: "maria@email.com", bloco: "A", unidade: "102" },
        ],
      });

      expect(result.total).toBe(2);
      expect(result.validos).toBe(2);
      expect(result.invalidos).toBe(0);
      expect(result.validacoes[0].valido).toBe(true);
      expect(result.validacoes[1].valido).toBe(true);
    });

    it("deve detectar email inválido", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "email-invalido", bloco: "A", unidade: "101" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].valido).toBe(false);
      expect(result.validacoes[0].erros).toContain("Formato de email inválido");
    });

    it("deve detectar email duplicado no sistema", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([
        { 
          id: 1, 
          condominioId: 1, 
          unidadeId: 1, 
          nome: "Existente", 
          email: "joao@email.com",
          telefone: null,
          cpf: null,
          tipo: "proprietario",
          isResponsavel: true,
          status: "aprovado",
          isBlocked: false,
          blockReason: null,
          userId: null,
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
      ]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "101" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].erros).toContain("Email já cadastrado no sistema");
    });

    it("deve detectar email duplicado no arquivo", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, blocoId: 1, numero: "102", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "101" },
          { linha: 3, nome: "João Duplicado", email: "joao@email.com", bloco: "A", unidade: "102" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[1].erros[0]).toContain("Email duplicado");
    });

    it("deve detectar bloco inexistente", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "Z", unidade: "101" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].erros).toContain('Bloco "Z" não existe neste condomínio');
    });

    it("deve detectar unidade inexistente", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "999" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].erros).toContain('Unidade "999" não existe no bloco "A"');
    });

    it("deve detectar nome muito curto", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "J", email: "joao@email.com", bloco: "A", unidade: "101" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].erros).toContain("Nome é obrigatório (mínimo 2 caracteres)");
    });

    it("deve validar tipo inválido", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.validarImportacao({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "101", tipo: "invalido" },
        ],
      });

      expect(result.invalidos).toBe(1);
      expect(result.validacoes[0].erros).toContain("Tipo deve ser: proprietario, inquilino ou dependente");
    });
  });

  describe("importarExcel", () => {
    it("deve importar moradores válidos com sucesso", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, blocoId: 1, numero: "102", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      vi.mocked(db.createMorador).mockImplementation(async (data) => ({
        id: Math.floor(Math.random() * 1000),
        condominioId: data.condominioId,
        unidadeId: data.unidadeId,
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        cpf: data.cpf || null,
        tipo: data.tipo || "proprietario",
        isResponsavel: data.isResponsavel || false,
        status: data.status || "pendente",
        isBlocked: false,
        blockReason: null,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await caller.moradores.importarExcel({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "A", unidade: "101" },
          { linha: 3, nome: "Maria Santos", email: "maria@email.com", bloco: "A", unidade: "102" },
        ],
      });

      expect(result.total).toBe(2);
      expect(result.sucessos).toBe(2);
      expect(result.erros).toBe(0);
      expect(db.createMorador).toHaveBeenCalledTimes(2);
    });

    it("deve reportar erros de importação", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getUnidadesByBloco).mockResolvedValue([
        { id: 1, blocoId: 1, numero: "101", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.importarExcel({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "email-invalido", bloco: "A", unidade: "101" },
        ],
      });

      expect(result.erros).toBe(1);
      expect(result.resultados[0].sucesso).toBe(false);
      expect(result.resultados[0].erro).toBe("Email inválido");
    });

    it("deve detectar bloco não encontrado na importação", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getBlocosByCondominio).mockResolvedValue([
        { id: 1, condominioId: 1, nome: "A", createdAt: new Date(), updatedAt: new Date() },
      ]);

      vi.mocked(db.getMoradoresByCondominio).mockResolvedValue([]);

      const result = await caller.moradores.importarExcel({
        condominioId: 1,
        dados: [
          { linha: 2, nome: "João Silva", email: "joao@email.com", bloco: "Z", unidade: "101" },
        ],
      });

      expect(result.erros).toBe(1);
      expect(result.resultados[0].erro).toContain('Bloco "Z" não encontrado');
    });
  });
});
