import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

// Mock do banco de dados
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Push Notifications Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVapidKey", () => {
    it("retorna a chave pública VAPID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.getVapidKey();

      expect(result).toHaveProperty("publicKey");
      expect(typeof result.publicKey).toBe("string");
      expect(result.publicKey.length).toBeGreaterThan(0);
    });
  });

  describe("subscribe", () => {
    it("registra uma subscription de push", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.subscribe({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
        deviceType: "mobile",
        deviceName: "Test Device",
      });

      expect(result).toHaveProperty("success");
    });

    it("requer autenticação para registrar subscription", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.push.subscribe({
          endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
          keys: {
            p256dh: "test-p256dh-key",
            auth: "test-auth-key",
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("unsubscribe", () => {
    it("remove uma subscription de push", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.unsubscribe({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      });

      expect(result).toHaveProperty("success");
    });
  });

  describe("getPreferences", () => {
    it("retorna preferências de notificação do usuário", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.getPreferences();

      // Deve retornar preferências padrão ou existentes
      expect(result).toBeDefined();
    });

    it("requer autenticação para obter preferências", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.push.getPreferences()).rejects.toThrow();
    });
  });

  describe("updatePreferences", () => {
    it("atualiza preferências de notificação", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.updatePreferences({
        pushEnabled: true,
        emailEnabled: false,
        notificarNovaReserva: true,
        notificarConfirmacao: true,
        notificarCancelamento: false,
        notificarLembrete: true,
        notificarCadastro: false,
      });

      expect(result).toHaveProperty("success");
    });

    it("permite atualização parcial de preferências", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.updatePreferences({
        pushEnabled: false,
      });

      expect(result).toHaveProperty("success");
    });
  });

  describe("sendTest", () => {
    it("envia notificação de teste para o usuário", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.sendTest();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("sent");
      expect(result).toHaveProperty("failed");
    });

    it("requer autenticação para enviar teste", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.push.sendTest()).rejects.toThrow();
    });
  });
});

describe("Push Service Functions", () => {
  describe("VAPID Key", () => {
    it("chave pública VAPID tem formato válido", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.getVapidKey();

      // Chave VAPID deve ser uma string base64url
      expect(result.publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("Subscription Validation", () => {
    it("aceita subscription com endpoint válido", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.subscribe({
        endpoint: "https://fcm.googleapis.com/fcm/send/valid-endpoint",
        keys: {
          p256dh: "valid-p256dh-key",
          auth: "valid-auth-key",
        },
      });

      expect(result).toHaveProperty("success");
    });

    it("aceita subscription com chaves válidas", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.push.subscribe({
        endpoint: "https://test.com/push",
        keys: {
          p256dh: "test-key-p256dh",
          auth: "test-key-auth",
        },
      });

      expect(result).toHaveProperty("success");
    });
  });
});

describe("Notification Templates", () => {
  it("templates de notificação estão definidos", async () => {
    // Importar templates do serviço
    const { pushTemplates } = await import('./push');

    expect(pushTemplates).toBeDefined();
    expect(pushTemplates.reservaCriada).toBeDefined();
    expect(pushTemplates.reservaConfirmada).toBeDefined();
    expect(pushTemplates.reservaCancelada).toBeDefined();
    expect(pushTemplates.lembrete).toBeDefined();
    expect(pushTemplates.cadastroAprovado).toBeDefined();
    expect(pushTemplates.cancelamentoDisponivel).toBeDefined();
  });

  it("template de reserva criada retorna payload válido", async () => {
    const { pushTemplates } = await import('./push');

    const payload = pushTemplates.reservaCriada("Piscina", "15/01/2026", "10:00");

    expect(payload).toHaveProperty("title");
    expect(payload).toHaveProperty("body");
    expect(payload.title).toContain("Nova Reserva");
    expect(payload.body).toContain("Piscina");
    expect(payload.body).toContain("15/01/2026");
    expect(payload.body).toContain("10:00");
  });

  it("template de reserva confirmada retorna payload válido", async () => {
    const { pushTemplates } = await import('./push');

    const payload = pushTemplates.reservaConfirmada("Churrasqueira", "20/01/2026", "14:00");

    expect(payload.title).toContain("Confirmada");
    expect(payload.body).toContain("Churrasqueira");
  });

  it("template de lembrete retorna payload com requireInteraction", async () => {
    const { pushTemplates } = await import('./push');

    const payload = pushTemplates.lembrete("Salão de Festas", "25/01/2026", "18:00");

    expect(payload.requireInteraction).toBe(true);
    expect(payload.body).toContain("amanhã");
  });

  it("template de cadastro aprovado inclui URL de ação", async () => {
    const { pushTemplates } = await import('./push');

    const payload = pushTemplates.cadastroAprovado("Condomínio Parque das Flores");

    expect(payload.data?.url).toBe("/nova-reserva");
    expect(payload.body).toContain("Condomínio Parque das Flores");
  });
});
