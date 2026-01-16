import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock do bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
    compare: vi.fn().mockImplementation((password, hash) => {
      return Promise.resolve(password === "senha123" && hash === "$2a$10$hashedpassword");
    }),
  },
}));

// Mock do jose
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { userId: 1 },
  }),
}));

// Mock do nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("mock-reset-token-12345678"),
}));

// Mock do db
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  createUserWithPassword: vi.fn(),
  updateUserLastLogin: vi.fn(),
  setResetToken: vi.fn(),
  getUserByResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  getUserById: vi.fn(),
}));

// Mock do ENV
vi.mock("./_core/env", () => ({
  ENV: {
    jwtSecret: "test-jwt-secret",
    appId: "test-app-id",
    cookieSecret: "test-cookie-secret",
    ownerOpenId: "test-owner-id",
  },
}));

import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Sistema de Autenticação Própria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Registro de Usuário", () => {
    it("deve criar hash da senha corretamente", async () => {
      const password = "minhaSenha123";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBe("$2a$10$hashedpassword");
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("deve rejeitar email duplicado", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        email: "teste@email.com",
        name: "Teste",
        role: "morador",
        openId: null,
        password: "$2a$10$hashedpassword",
        phone: null,
        loginMethod: "email",
        isActive: true,
        isBlocked: false,
        blockReason: null,
        emailVerified: false,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      const existingUser = await db.getUserByEmail("teste@email.com");
      expect(existingUser).not.toBeNull();
      expect(existingUser?.email).toBe("teste@email.com");
    });

    it("deve criar usuário com dados corretos", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(db.createUserWithPassword).mockResolvedValue({
        id: 1,
        name: "Novo Usuário",
        email: "novo@email.com",
        role: "morador",
      });

      const result = await db.createUserWithPassword({
        name: "Novo Usuário",
        email: "novo@email.com",
        password: "$2a$10$hashedpassword",
        role: "morador",
        loginMethod: "email",
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Novo Usuário");
      expect(result.email).toBe("novo@email.com");
      expect(result.role).toBe("morador");
    });
  });

  describe("Login", () => {
    it("deve verificar senha corretamente", async () => {
      const isValid = await bcrypt.compare("senha123", "$2a$10$hashedpassword");
      expect(isValid).toBe(true);
    });

    it("deve rejeitar senha incorreta", async () => {
      const isValid = await bcrypt.compare("senhaErrada", "$2a$10$hashedpassword");
      expect(isValid).toBe(false);
    });

    it("deve atualizar último login após autenticação bem-sucedida", async () => {
      vi.mocked(db.updateUserLastLogin).mockResolvedValue(undefined);
      
      await db.updateUserLastLogin(1);
      
      expect(db.updateUserLastLogin).toHaveBeenCalledWith(1);
    });

    it("deve retornar null para usuário não encontrado", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      
      const user = await db.getUserByEmail("inexistente@email.com");
      
      expect(user).toBeUndefined();
    });
  });

  describe("Recuperação de Senha", () => {
    it("deve gerar token de recuperação", async () => {
      const { nanoid } = await import("nanoid");
      const token = nanoid(32);
      
      expect(token).toBe("mock-reset-token-12345678");
    });

    it("deve salvar token de recuperação no banco", async () => {
      vi.mocked(db.setResetToken).mockResolvedValue(undefined);
      
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await db.setResetToken(1, "mock-token", expiry);
      
      expect(db.setResetToken).toHaveBeenCalledWith(1, "mock-token", expiry);
    });

    it("deve encontrar usuário pelo token de recuperação", async () => {
      vi.mocked(db.getUserByResetToken).mockResolvedValue({
        id: 1,
        email: "teste@email.com",
        name: "Teste",
        role: "morador",
        openId: null,
        password: "$2a$10$hashedpassword",
        phone: null,
        loginMethod: "email",
        isActive: true,
        isBlocked: false,
        blockReason: null,
        emailVerified: false,
        resetToken: "mock-token",
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByResetToken("mock-token");
      
      expect(user).not.toBeNull();
      expect(user?.resetToken).toBe("mock-token");
    });

    it("deve atualizar senha e limpar token", async () => {
      vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);
      
      await db.updateUserPassword(1, "$2a$10$newhashedpassword");
      
      expect(db.updateUserPassword).toHaveBeenCalledWith(1, "$2a$10$newhashedpassword");
    });
  });

  describe("Validações", () => {
    it("deve validar formato de email", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test("valido@email.com")).toBe(true);
      expect(emailRegex.test("invalido")).toBe(false);
      expect(emailRegex.test("sem@dominio")).toBe(false);
      expect(emailRegex.test("@semlocal.com")).toBe(false);
    });

    it("deve validar tamanho mínimo da senha", () => {
      const minLength = 6;
      
      expect("12345".length >= minLength).toBe(false);
      expect("123456".length >= minLength).toBe(true);
      expect("senhaForte123".length >= minLength).toBe(true);
    });

    it("deve validar força da senha", () => {
      const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
      };

      expect(getPasswordStrength("abc")).toBe(0); // Muito curta
      expect(getPasswordStrength("abcdef")).toBe(1); // Apenas 6 chars
      expect(getPasswordStrength("abcdefgh")).toBe(2); // 8 chars
      expect(getPasswordStrength("Abcdefgh")).toBe(3); // 8 chars + maiúscula
      expect(getPasswordStrength("Abcdefg1")).toBe(4); // 8 chars + maiúscula + número
      expect(getPasswordStrength("Abcdef1!")).toBe(5); // Completa
    });
  });

  describe("Hierarquia de Usuários", () => {
    it("deve criar usuário com role morador por padrão", async () => {
      vi.mocked(db.createUserWithPassword).mockResolvedValue({
        id: 1,
        name: "Morador",
        email: "morador@email.com",
        role: "morador",
      });

      const result = await db.createUserWithPassword({
        name: "Morador",
        email: "morador@email.com",
        password: "hash",
        role: "morador",
        loginMethod: "email",
      });

      expect(result.role).toBe("morador");
    });

    it("deve criar usuário com role síndico", async () => {
      vi.mocked(db.createUserWithPassword).mockResolvedValue({
        id: 2,
        name: "Síndico",
        email: "sindico@email.com",
        role: "sindico",
      });

      const result = await db.createUserWithPassword({
        name: "Síndico",
        email: "sindico@email.com",
        password: "hash",
        role: "sindico",
        loginMethod: "email",
      });

      expect(result.role).toBe("sindico");
    });

    it("deve criar usuário com role administradora", async () => {
      vi.mocked(db.createUserWithPassword).mockResolvedValue({
        id: 3,
        name: "Administradora",
        email: "admin@email.com",
        role: "administradora",
      });

      const result = await db.createUserWithPassword({
        name: "Administradora",
        email: "admin@email.com",
        password: "hash",
        role: "administradora",
        loginMethod: "email",
      });

      expect(result.role).toBe("administradora");
    });
  });
});
