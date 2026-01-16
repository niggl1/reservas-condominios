import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAllCondominios: vi.fn().mockResolvedValue([
    { id: 1, nome: "Condomínio Teste", endereco: "Rua Teste, 123" }
  ]),
  getCondominiosByAdministradora: vi.fn().mockResolvedValue([]),
  getCondominiosBySindico: vi.fn().mockResolvedValue([]),
  getCondominioById: vi.fn().mockResolvedValue({ id: 1, nome: "Condomínio Teste" }),
  createCondominio: vi.fn().mockResolvedValue({ id: 1 }),
  getAreasComunsByCondominio: vi.fn().mockResolvedValue([
    { id: 1, nome: "Piscina", condominioId: 1, ativo: true }
  ]),
  getAreaComumById: vi.fn().mockResolvedValue({
    id: 1,
    nome: "Piscina",
    condominioId: 1,
    capacidadeMaxima: 20,
    valor: "50.00"
  }),
  getReservasByCondominio: vi.fn().mockResolvedValue([]),
  getReservaById: vi.fn().mockResolvedValue({
    id: 1,
    protocolo: "ABC123",
    status: "pendente",
    dataReserva: new Date(),
    horaInicio: "10:00",
    horaFim: "12:00"
  }),
  createReserva: vi.fn().mockResolvedValue({ id: 1, protocolo: "ABC123" }),
  confirmarReserva: vi.fn().mockResolvedValue(undefined),
  cancelarReserva: vi.fn().mockResolvedValue(undefined),
  createTimelineAcao: vi.fn().mockResolvedValue({ id: 1 }),
  getInteressadosCancelamento: vi.fn().mockResolvedValue([]),
  notificarInteressados: vi.fn().mockResolvedValue(undefined),
  getInteressadosByAreaAndDate: vi.fn().mockResolvedValue([]),
  getMoradoresByCondominio: vi.fn().mockResolvedValue([]),
  getMoradorById: vi.fn().mockResolvedValue({ id: 1, nome: "Morador Teste" }),
  getMoradorByUserId: vi.fn().mockResolvedValue({ id: 1, nome: "Morador Teste" }),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Admin", email: "admin@test.com", role: "super_admin" }
  ]),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Admin", role: "super_admin" }),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createSuperAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "super-admin-user",
    email: "admin@example.com",
    name: "Super Admin",
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

function createMoradorContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "morador-user",
    email: "morador@example.com",
    name: "Morador Teste",
    loginMethod: "manus",
    role: "morador",
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

describe("Condominios Router", () => {
  it("super_admin can list all condominios", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.condominios.list();

    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("Condomínio Teste");
  });

  it("super_admin can get condominio by id", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.condominios.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.nome).toBe("Condomínio Teste");
  });
});

describe("Areas Comuns Router", () => {
  it("can list areas by condominio", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.areasComuns.list({ condominioId: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("Piscina");
  });

  it("can get area by id", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.areasComuns.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.nome).toBe("Piscina");
    expect(result?.capacidadeMaxima).toBe(20);
  });
});

describe("Reservas Router", () => {
  it("can get reserva by id", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reservas.getById({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.protocolo).toBe("ABC123");
    expect(result?.status).toBe("pendente");
  });

  it("can confirm reserva", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reservas.confirmar({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("can cancel reserva", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reservas.cancelar({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("Users Router", () => {
  it("super_admin can list all users", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.list();

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("super_admin");
  });

  it("super_admin can update user role", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.updateRole({ userId: 2, role: "sindico" });

    expect(result).toEqual({ success: true });
  });
});

describe("Auth Router", () => {
  it("returns user info for authenticated user", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.name).toBe("Super Admin");
    expect(result?.role).toBe("super_admin");
  });

  it("logout clears session", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
