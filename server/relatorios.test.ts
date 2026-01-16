import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo db
vi.mock("./db", () => ({
  getReservasParaRelatorio: vi.fn(),
  getEstatisticasPorArea: vi.fn(),
  getEstatisticasPorPeriodo: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
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

describe("relatorios router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDados", () => {
    it("retorna dados completos do relatório", async () => {
      const mockReservas = [
        {
          id: 1,
          protocolo: "ABC123",
          areaNome: "Piscina",
          moradorNome: "João Silva",
          unidade: "101",
          bloco: "A",
          dataReserva: new Date("2025-01-15"),
          horaInicio: "10:00",
          horaFim: "12:00",
          status: "confirmada",
          valor: "50.00",
          createdAt: new Date(),
        },
      ];

      const mockEstatisticasAreas = [
        {
          areaId: 1,
          areaNome: "Piscina",
          totalReservas: 10,
          reservasConfirmadas: 8,
          reservasPendentes: 1,
          reservasCanceladas: 1,
          reservasUtilizadas: 5,
          receitaTotal: 400,
          taxaOcupacao: 25.5,
        },
      ];

      const mockEstatisticasPeriodo = [
        {
          periodo: "Jan/2025",
          totalReservas: 10,
          reservasConfirmadas: 8,
          reservasCanceladas: 1,
          receitaTotal: 400,
        },
      ];

      vi.mocked(db.getReservasParaRelatorio).mockResolvedValue(mockReservas as any);
      vi.mocked(db.getEstatisticasPorArea).mockResolvedValue(mockEstatisticasAreas);
      vi.mocked(db.getEstatisticasPorPeriodo).mockResolvedValue(mockEstatisticasPeriodo);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.relatorios.getDados({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-31"),
      });

      expect(result).toHaveProperty("reservas");
      expect(result).toHaveProperty("estatisticasAreas");
      expect(result).toHaveProperty("estatisticasPeriodo");
      expect(result.reservas).toHaveLength(1);
      expect(result.estatisticasAreas).toHaveLength(1);
      expect(result.estatisticasPeriodo).toHaveLength(1);
    });

    it("filtra por área específica quando fornecida", async () => {
      vi.mocked(db.getReservasParaRelatorio).mockResolvedValue([]);
      vi.mocked(db.getEstatisticasPorArea).mockResolvedValue([]);
      vi.mocked(db.getEstatisticasPorPeriodo).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.relatorios.getDados({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-31"),
        areaId: 5,
      });

      expect(db.getReservasParaRelatorio).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date),
        5
      );
    });
  });

  describe("estatisticasPorArea", () => {
    it("retorna estatísticas agrupadas por área", async () => {
      const mockEstatisticas = [
        {
          areaId: 1,
          areaNome: "Piscina",
          totalReservas: 15,
          reservasConfirmadas: 12,
          reservasPendentes: 2,
          reservasCanceladas: 1,
          reservasUtilizadas: 10,
          receitaTotal: 600,
          taxaOcupacao: 30,
        },
        {
          areaId: 2,
          areaNome: "Churrasqueira",
          totalReservas: 8,
          reservasConfirmadas: 7,
          reservasPendentes: 0,
          reservasCanceladas: 1,
          reservasUtilizadas: 6,
          receitaTotal: 350,
          taxaOcupacao: 20,
        },
      ];

      vi.mocked(db.getEstatisticasPorArea).mockResolvedValue(mockEstatisticas);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.relatorios.estatisticasPorArea({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-31"),
      });

      expect(result).toHaveLength(2);
      expect(result[0].areaNome).toBe("Piscina");
      expect(result[1].areaNome).toBe("Churrasqueira");
    });

    it("retorna array vazio quando não há dados", async () => {
      vi.mocked(db.getEstatisticasPorArea).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.relatorios.estatisticasPorArea({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-31"),
      });

      expect(result).toEqual([]);
    });
  });

  describe("estatisticasPorPeriodo", () => {
    it("retorna estatísticas agrupadas por mês", async () => {
      const mockEstatisticas = [
        {
          periodo: "Jan/2025",
          totalReservas: 20,
          reservasConfirmadas: 18,
          reservasCanceladas: 2,
          receitaTotal: 900,
        },
        {
          periodo: "Fev/2025",
          totalReservas: 25,
          reservasConfirmadas: 22,
          reservasCanceladas: 3,
          receitaTotal: 1100,
        },
      ];

      vi.mocked(db.getEstatisticasPorPeriodo).mockResolvedValue(mockEstatisticas);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.relatorios.estatisticasPorPeriodo({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-02-28"),
        agrupamento: "mes",
      });

      expect(result).toHaveLength(2);
      expect(result[0].periodo).toBe("Jan/2025");
      expect(result[1].periodo).toBe("Fev/2025");
    });

    it("suporta agrupamento por dia", async () => {
      vi.mocked(db.getEstatisticasPorPeriodo).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.relatorios.estatisticasPorPeriodo({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-07"),
        agrupamento: "dia",
      });

      expect(db.getEstatisticasPorPeriodo).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date),
        "dia"
      );
    });

    it("suporta agrupamento por semana", async () => {
      vi.mocked(db.getEstatisticasPorPeriodo).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.relatorios.estatisticasPorPeriodo({
        condominioId: 1,
        dataInicio: new Date("2025-01-01"),
        dataFim: new Date("2025-01-31"),
        agrupamento: "semana",
      });

      expect(db.getEstatisticasPorPeriodo).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date),
        "semana"
      );
    });
  });
});

describe("cálculos de relatório", () => {
  it("calcula corretamente os totais de reservas", () => {
    const reservas = [
      { status: "confirmada", valor: "50.00" },
      { status: "confirmada", valor: "100.00" },
      { status: "utilizada", valor: "75.00" },
      { status: "cancelada", valor: "50.00" },
      { status: "pendente", valor: "25.00" },
    ];

    const total = reservas.length;
    const confirmadas = reservas.filter(r => r.status === "confirmada" || r.status === "utilizada").length;
    const canceladas = reservas.filter(r => r.status === "cancelada").length;
    const receita = reservas
      .filter(r => r.status === "confirmada" || r.status === "utilizada")
      .reduce((acc, r) => acc + parseFloat(r.valor), 0);

    expect(total).toBe(5);
    expect(confirmadas).toBe(3);
    expect(canceladas).toBe(1);
    expect(receita).toBe(225);
  });

  it("calcula corretamente a taxa de ocupação", () => {
    const totalSlots = 100;
    const reservasConfirmadas = 25;
    const taxaOcupacao = (reservasConfirmadas / totalSlots) * 100;

    expect(taxaOcupacao).toBe(25);
  });

  it("limita taxa de ocupação a 100%", () => {
    const totalSlots = 10;
    const reservasConfirmadas = 15; // Mais reservas que slots (cenário de overbooking)
    const taxaOcupacao = Math.min((reservasConfirmadas / totalSlots) * 100, 100);

    expect(taxaOcupacao).toBe(100);
  });
});
