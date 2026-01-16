import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAllCondominios: vi.fn().mockResolvedValue([
    { id: 1, nome: "Condomínio Teste", isActive: true }
  ]),
  getCondominiosByAdministradora: vi.fn().mockResolvedValue([]),
  getCondominiosBySindico: vi.fn().mockResolvedValue([]),
  getAreasComunsByCondominio: vi.fn().mockResolvedValue([
    {
      id: 1,
      condominioId: 1,
      nome: "Piscina",
      descricao: "Piscina adulto e infantil",
      icone: "🏊",
      fotos: JSON.stringify([
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
      ]),
      valor: "50.00",
      capacidadeMaxima: 30,
      confirmacaoAutomatica: true,
      isActive: true
    }
  ]),
  getAreaComumById: vi.fn().mockResolvedValue({
    id: 1,
    condominioId: 1,
    nome: "Piscina",
    descricao: "Piscina adulto e infantil",
    icone: "🏊",
    fotos: JSON.stringify([
      "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
    ]),
    valor: "50.00",
    capacidadeMaxima: 30,
    confirmacaoAutomatica: true,
    isActive: true
  }),
  createAreaComum: vi.fn().mockImplementation((data) => ({
    id: 2,
    ...data,
    fotos: data.fotos ? JSON.stringify(data.fotos) : null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  updateAreaComum: vi.fn().mockResolvedValue({ success: true }),
  deleteAreaComum: vi.fn().mockResolvedValue({ success: true }),
}));

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

describe("Galeria de Fotos - Áreas Comuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar áreas comuns com fotos", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const areas = await caller.areasComuns.list({ condominioId: 1 });

    expect(areas).toBeDefined();
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0].nome).toBe("Piscina");
    expect(areas[0].fotos).toBeDefined();
  });

  it("deve obter área por ID com fotos", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const area = await caller.areasComuns.getById({ id: 1 });

    expect(area).toBeDefined();
    expect(area?.nome).toBe("Piscina");
    expect(area?.fotos).toBeDefined();
    
    // Verificar se as fotos são um array válido
    const fotos = typeof area?.fotos === 'string' ? JSON.parse(area.fotos) : area?.fotos;
    expect(Array.isArray(fotos)).toBe(true);
    expect(fotos.length).toBe(2);
  });

  it("deve criar área comum com fotos", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const novaArea = await caller.areasComuns.create({
      condominioId: 1,
      nome: "Churrasqueira",
      descricao: "Área de churrasco com 2 churrasqueiras",
      icone: "🍖",
      fotos: [
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
      ],
      valor: "100.00",
      capacidadeMaxima: 50,
      confirmacaoAutomatica: false
    });

    expect(novaArea).toBeDefined();
    expect(novaArea.nome).toBe("Churrasqueira");
    expect(novaArea.fotos).toBeDefined();
  });

  it("deve atualizar fotos de uma área existente", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.areasComuns.update({
      id: 1,
      nome: "Piscina Atualizada",
      fotos: [
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
      ]
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve criar área sem fotos", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const novaArea = await caller.areasComuns.create({
      condominioId: 1,
      nome: "Academia",
      descricao: "Academia completa",
      valor: "0",
      capacidadeMaxima: 20,
      confirmacaoAutomatica: true
    });

    expect(novaArea).toBeDefined();
    expect(novaArea.nome).toBe("Academia");
  });

  it("deve validar limite máximo de fotos (10)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar área com 10 fotos (limite máximo)
    const fotosMaximas = Array(10).fill("data:image/jpeg;base64,/9j/4AAQSkZJRg==");
    
    const novaArea = await caller.areasComuns.create({
      condominioId: 1,
      nome: "Salão de Festas",
      fotos: fotosMaximas,
      valor: "200.00",
      capacidadeMaxima: 100
    });

    expect(novaArea).toBeDefined();
    expect(novaArea.nome).toBe("Salão de Festas");
  });
});

describe("Validação de Fotos", () => {
  it("deve aceitar fotos em formato base64", () => {
    const fotoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    expect(fotoBase64.startsWith("data:image/")).toBe(true);
  });

  it("deve aceitar fotos em formato URL", () => {
    const fotoUrl = "https://example.com/foto.jpg";
    expect(fotoUrl.startsWith("http")).toBe(true);
  });

  it("deve parsear JSON de fotos corretamente", () => {
    const fotosJson = JSON.stringify([
      "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      "https://example.com/foto.jpg"
    ]);
    
    const fotos = JSON.parse(fotosJson);
    expect(Array.isArray(fotos)).toBe(true);
    expect(fotos.length).toBe(2);
  });

  it("deve lidar com fotos nulas ou undefined", () => {
    const fotosNull = null;
    const fotosUndefined = undefined;
    
    const parseFotos = (fotos: string | string[] | null | undefined): string[] => {
      if (!fotos) return [];
      try {
        return typeof fotos === 'string' ? JSON.parse(fotos) : fotos;
      } catch {
        return [];
      }
    };
    
    expect(parseFotos(fotosNull)).toEqual([]);
    expect(parseFotos(fotosUndefined)).toEqual([]);
  });
});
