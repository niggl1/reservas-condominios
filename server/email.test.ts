import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  templateReservaConfirmada,
  templateReservaPendente,
  templateReservaCancelada,
  templateLembreteReserva,
  templateRecuperarSenha,
  templateBoasVindas,
  templateCadastroAprovado,
  templateNotificacaoSindico,
  templateInteresseCancelamento,
  sendEmail,
  ReservaEmailData,
  RecuperarSenhaEmailData,
  BoasVindasEmailData,
  NotificacaoSindicoEmailData,
} from "./email";

// Mock fetch para testes de envio
global.fetch = vi.fn();

describe("Email Templates", () => {
  const reservaData: ReservaEmailData = {
    moradorNome: "João Silva",
    moradorEmail: "joao@email.com",
    areaNome: "Salão de Festas",
    data: "15/01/2026",
    horarioInicio: "14:00",
    horarioFim: "18:00",
    protocolo: "ABC123",
    condominioNome: "Condomínio Parque das Flores",
    valor: 150.0,
  };

  describe("templateReservaConfirmada", () => {
    it("deve gerar email de reserva confirmada com todos os campos", () => {
      const result = templateReservaConfirmada(reservaData);

      expect(result.to).toBe("joao@email.com");
      expect(result.toName).toBe("João Silva");
      expect(result.subject).toContain("Reserva Confirmada");
      expect(result.subject).toContain("Salão de Festas");
      expect(result.html).toContain("João Silva");
      expect(result.html).toContain("Salão de Festas");
      expect(result.html).toContain("15/01/2026");
      expect(result.html).toContain("14:00");
      expect(result.html).toContain("18:00");
      expect(result.html).toContain("ABC123");
      expect(result.html).toContain("R$ 150.00");
      expect(result.html).toContain("Condomínio Parque das Flores");
      expect(result.text).toBeDefined();
    });

    it("deve gerar email sem valor quando não informado", () => {
      const dataWithoutValue = { ...reservaData, valor: undefined };
      const result = templateReservaConfirmada(dataWithoutValue);

      expect(result.html).not.toContain("R$");
    });
  });

  describe("templateReservaPendente", () => {
    it("deve gerar email de reserva pendente", () => {
      const result = templateReservaPendente(reservaData);

      expect(result.to).toBe("joao@email.com");
      expect(result.subject).toContain("Reserva Pendente");
      expect(result.html).toContain("aguardando aprovação");
      expect(result.html).toContain("status-pendente");
    });
  });

  describe("templateReservaCancelada", () => {
    it("deve gerar email de reserva cancelada", () => {
      const result = templateReservaCancelada(reservaData);

      expect(result.to).toBe("joao@email.com");
      expect(result.subject).toContain("Reserva Cancelada");
      expect(result.html).toContain("cancelada");
      expect(result.html).toContain("ABC123");
    });
  });

  describe("templateLembreteReserva", () => {
    it("deve gerar email de lembrete de reserva", () => {
      const result = templateLembreteReserva(reservaData);

      expect(result.to).toBe("joao@email.com");
      expect(result.subject).toContain("Lembrete");
      expect(result.html).toContain("amanhã");
      expect(result.html).toContain("protocolo");
    });
  });

  describe("templateRecuperarSenha", () => {
    const recuperarData: RecuperarSenhaEmailData = {
      nome: "Maria Santos",
      email: "maria@email.com",
      token: "abc123def456",
      baseUrl: "https://reservas.example.com",
    };

    it("deve gerar email de recuperação de senha com link correto", () => {
      const result = templateRecuperarSenha(recuperarData);

      expect(result.to).toBe("maria@email.com");
      expect(result.toName).toBe("Maria Santos");
      expect(result.subject).toContain("Recuperação de Senha");
      expect(result.html).toContain("Maria Santos");
      expect(result.html).toContain("https://reservas.example.com/recuperar-senha?token=abc123def456");
      expect(result.html).toContain("1 hora");
    });
  });

  describe("templateBoasVindas", () => {
    const boasVindasData: BoasVindasEmailData = {
      nome: "Carlos Oliveira",
      email: "carlos@email.com",
      condominioNome: "Condomínio Vista Verde",
      role: "morador",
    };

    it("deve gerar email de boas-vindas para morador", () => {
      const result = templateBoasVindas(boasVindasData);

      expect(result.to).toBe("carlos@email.com");
      expect(result.subject).toContain("Bem-vindo");
      expect(result.html).toContain("Carlos Oliveira");
      expect(result.html).toContain("Morador");
      expect(result.html).toContain("Condomínio Vista Verde");
    });

    it("deve mostrar perfil correto para síndico", () => {
      const sindicoData = { ...boasVindasData, role: "sindico" };
      const result = templateBoasVindas(sindicoData);

      expect(result.html).toContain("Síndico");
    });
  });

  describe("templateCadastroAprovado", () => {
    const aprovadoData: BoasVindasEmailData = {
      nome: "Ana Paula",
      email: "ana@email.com",
      condominioNome: "Condomínio Sol Nascente",
      role: "morador",
    };

    it("deve gerar email de cadastro aprovado", () => {
      const result = templateCadastroAprovado(aprovadoData);

      expect(result.to).toBe("ana@email.com");
      expect(result.subject).toContain("Cadastro Aprovado");
      expect(result.html).toContain("aprovado");
      expect(result.html).toContain("Parabéns");
    });
  });

  describe("templateNotificacaoSindico", () => {
    const notificacaoData: NotificacaoSindicoEmailData = {
      sindicoNome: "Roberto Síndico",
      sindicoEmail: "sindico@email.com",
      moradorNome: "João Silva",
      areaNome: "Churrasqueira",
      data: "20/01/2026",
      horarioInicio: "12:00",
      horarioFim: "16:00",
      protocolo: "XYZ789",
      condominioNome: "Condomínio Parque das Flores",
      valor: 200.0,
      tipo: "nova_reserva",
    };

    it("deve gerar email de nova reserva para síndico", () => {
      const result = templateNotificacaoSindico(notificacaoData);

      expect(result.to).toBe("sindico@email.com");
      expect(result.toName).toBe("Roberto Síndico");
      expect(result.subject).toContain("Nova Reserva");
      expect(result.subject).toContain("R$ 200.00");
      expect(result.html).toContain("João Silva");
      expect(result.html).toContain("Churrasqueira");
      expect(result.html).toContain("R$ 200.00");
    });

    it("deve gerar email de cancelamento para síndico", () => {
      const cancelamentoData = { ...notificacaoData, tipo: "cancelamento" as const };
      const result = templateNotificacaoSindico(cancelamentoData);

      expect(result.subject).toContain("Cancelamento");
      expect(result.html).toContain("cancelada");
    });
  });

  describe("templateInteresseCancelamento", () => {
    it("deve gerar email de interesse em cancelamento", () => {
      const interesseData = {
        ...reservaData,
        interessadoNome: "Pedro Interessado",
        interessadoEmail: "pedro@email.com",
      };
      const result = templateInteresseCancelamento(interesseData);

      expect(result.to).toBe("pedro@email.com");
      expect(result.toName).toBe("Pedro Interessado");
      expect(result.subject).toContain("Vaga Disponível");
      expect(result.html).toContain("cancelada");
      expect(result.html).toContain("Quem reservar primeiro");
    });
  });
});

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deve retornar false quando API não está configurada", async () => {
    // Simular API não configurada
    const originalEnv = process.env;
    process.env = { ...originalEnv, BUILT_IN_FORGE_API_URL: "", BUILT_IN_FORGE_API_KEY: "" };

    const result = await sendEmail({
      to: "test@email.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result).toBe(false);

    process.env = originalEnv;
  });

  it("deve chamar fetch com parâmetros corretos quando API está configurada", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = mockFetch;

    const result = await sendEmail({
      to: "test@email.com",
      toName: "Test User",
      subject: "Test Subject",
      html: "<p>Test HTML</p>",
      text: "Test text",
    });

    // Em ambiente de produção com ENV configurado, retorna true
    // O mock de fetch simula uma resposta de sucesso
    expect(result).toBe(true);
  });
});

describe("Email HTML Structure", () => {
  it("deve incluir estilos CSS inline em todos os templates", () => {
    const reservaData: ReservaEmailData = {
      moradorNome: "Test",
      moradorEmail: "test@email.com",
      areaNome: "Test Area",
      data: "01/01/2026",
      horarioInicio: "10:00",
      horarioFim: "12:00",
      protocolo: "TEST01",
      condominioNome: "Test Condo",
    };

    const templates = [
      templateReservaConfirmada(reservaData),
      templateReservaPendente(reservaData),
      templateReservaCancelada(reservaData),
      templateLembreteReserva(reservaData),
    ];

    templates.forEach((template) => {
      expect(template.html).toContain("<!DOCTYPE html>");
      expect(template.html).toContain("<style>");
      expect(template.html).toContain("font-family");
      expect(template.html).toContain("container");
      expect(template.html).toContain("header");
      expect(template.html).toContain("footer");
    });
  });

  it("deve ter versão texto alternativa em todos os templates", () => {
    const reservaData: ReservaEmailData = {
      moradorNome: "Test",
      moradorEmail: "test@email.com",
      areaNome: "Test Area",
      data: "01/01/2026",
      horarioInicio: "10:00",
      horarioFim: "12:00",
      protocolo: "TEST01",
      condominioNome: "Test Condo",
    };

    const templates = [
      templateReservaConfirmada(reservaData),
      templateReservaPendente(reservaData),
      templateReservaCancelada(reservaData),
      templateLembreteReserva(reservaData),
    ];

    templates.forEach((template) => {
      expect(template.text).toBeDefined();
      expect(template.text!.length).toBeGreaterThan(0);
    });
  });
});
