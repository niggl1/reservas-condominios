import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";
import * as emailService from "./email";
import * as pushService from "./push";

// Helper para criar JWT
const createToken = async (userId: number) => {
  const secret = new TextEncoder().encode(ENV.jwtSecret);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return token;
};

// ==================== AUTH ROUTER ====================
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // Registro de novo usuário
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      phone: z.string().optional(),
      role: z.enum(["administradora", "sindico", "morador"]).default("morador"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se email já existe
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Criar usuário
      const user = await db.createUserWithPassword({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        role: input.role,
        loginMethod: 'email',
      });

      // Criar token e setar cookie
      const token = await createToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  // Login com email/senha
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Senha é obrigatória"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar usuário por email
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
      }

      // Verificar se usuário está bloqueado
      if (user.isBlocked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: user.blockReason || 'Usuário bloqueado' });
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Conta desativada' });
      }

      // Verificar senha
      if (!user.password) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não possui senha cadastrada' });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
      }

      // Atualizar último login
      await db.updateUserLastLogin(user.id);

      // Criar token e setar cookie
      const token = await createToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  // Solicitar recuperação de senha
  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      // Sempre retornar sucesso para não revelar se email existe
      if (!user) {
        return { success: true, message: 'Se o email existir, você receberá instruções de recuperação' };
      }

      // Gerar token de recuperação
      const resetToken = nanoid(32);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await db.setResetToken(user.id, resetToken, resetTokenExpiry);

      // Enviar email de recuperação
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://reservas.manus.space' 
        : 'http://localhost:3000';
      
      const emailData = emailService.templateRecuperarSenha({
        nome: user.name || 'Usuário',
        email: user.email!,
        token: resetToken,
        baseUrl,
      });
      
      await emailService.sendEmail(emailData);
      console.log(`Email de recuperação enviado para ${input.email}`);

      return { success: true, message: 'Se o email existir, você receberá instruções de recuperação' };
    }),

  // Redefinir senha com token
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1, "Token é obrigatório"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      // Buscar usuário pelo token
      const user = await db.getUserByResetToken(input.token);
      if (!user) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token inválido ou expirado' });
      }

      // Verificar se token não expirou
      if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado' });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Atualizar senha e limpar token
      await db.updateUserPassword(user.id, hashedPassword);

      return { success: true, message: 'Senha atualizada com sucesso' };
    }),

  // Alterar senha (usuário logado)
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.password) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Usuário não encontrado' });
      }

      // Verificar senha atual
      const validPassword = await bcrypt.compare(input.currentPassword, user.password);
      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha atual incorreta' });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Atualizar senha
      await db.updateUserPassword(user.id, hashedPassword);

      return { success: true, message: 'Senha alterada com sucesso' };
    }),
});

// ==================== CONDOMÍNIOS ROUTER ====================
const condominiosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (user.role === 'super_admin') {
      return db.getAllCondominios();
    } else if (user.role === 'administradora') {
      return db.getCondominiosByAdministradora(user.id);
    } else if (user.role === 'sindico') {
      return db.getCondominiosBySindico(user.id);
    }
    return [];
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getCondominioById(input.id);
    }),
  
  getByLink: publicProcedure
    .input(z.object({ link: z.string() }))
    .query(async ({ input }) => {
      return db.getCondominioByLink(input.link);
    }),
  
  create: protectedProcedure
    .input(z.object({
      nome: z.string().min(1),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      cep: z.string().optional(),
      cnpj: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().email().optional(),
      logo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (user.role !== 'super_admin' && user.role !== 'administradora') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para criar condomínios' });
      }
      const administradoraId = user.role === 'administradora' ? user.id : undefined;
      return db.createCondominio({ ...input, administradoraId });
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().min(1).optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      cep: z.string().optional(),
      cnpj: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().email().optional(),
      logo: z.string().optional(),
      sindicoId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCondominio(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCondominio(input.id);
      return { success: true };
    }),
  
  getEstatisticas: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getEstatisticasCondominio(input.condominioId);
    }),
});

// ==================== BLOCOS ROUTER ====================
const blocosRouter = router({
  list: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getBlocosByCondominio(input.condominioId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      nome: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      return db.createBloco(input);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteBloco(input.id);
      return { success: true };
    }),
});

// ==================== UNIDADES ROUTER ====================
const unidadesRouter = router({
  list: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getUnidadesByCondominio(input.condominioId);
    }),
  
  listByBloco: protectedProcedure
    .input(z.object({ blocoId: z.number() }))
    .query(async ({ input }) => {
      return db.getUnidadesByBloco(input.blocoId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      blocoId: z.number().optional(),
      numero: z.string().min(1),
      tipo: z.enum(['apartamento', 'casa', 'sala', 'loja']).optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createUnidade(input);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteUnidade(input.id);
      return { success: true };
    }),
});

// ==================== MORADORES ROUTER ====================
const moradoresRouter = router({
  list: protectedProcedure
    .input(z.object({ 
      condominioId: z.number(),
      status: z.enum(['pendente', 'aprovado', 'rejeitado']).optional(),
    }))
    .query(async ({ input }) => {
      return db.getMoradoresByCondominioComFiltro(input.condominioId, input.status);
    }),
  
  listByUnidade: protectedProcedure
    .input(z.object({ unidadeId: z.number() }))
    .query(async ({ input }) => {
      return db.getMoradoresByUnidade(input.unidadeId);
    }),
  
  listPendentes: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getMoradoresPendentes(input.condominioId);
    }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getMoradorById(input.id);
    }),
  
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getMoradorByUserId(input.userId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      unidadeId: z.number(),
      nome: z.string().min(1),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      cpf: z.string().optional(),
      tipo: z.enum(['proprietario', 'inquilino', 'dependente']).optional(),
      isResponsavel: z.boolean().optional(),
      status: z.enum(['pendente', 'aprovado', 'rejeitado']).optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createMorador(input);
    }),
  
  // Auto-cadastro público via link
  autoCadastro: publicProcedure
    .input(z.object({
      linkCondominio: z.string(),
      unidadeId: z.number(),
      nome: z.string().min(1),
      email: z.string().email(),
      telefone: z.string().optional(),
      cpf: z.string().optional(),
      tipo: z.enum(['proprietario', 'inquilino', 'dependente']).optional(),
    }))
    .mutation(async ({ input }) => {
      const condominio = await db.getCondominioByLink(input.linkCondominio);
      if (!condominio) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Condomínio não encontrado' });
      }
      return db.createMorador({
        condominioId: condominio.id,
        unidadeId: input.unidadeId,
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        cpf: input.cpf,
        tipo: input.tipo,
        status: 'pendente',
      });
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().min(1).optional(),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      cpf: z.string().optional(),
      tipo: z.enum(['proprietario', 'inquilino', 'dependente']).optional(),
      isResponsavel: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateMorador(id, data);
      return { success: true };
    }),
  
  aprovar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.aprovarMorador(input.id);
      return { success: true };
    }),
  
  rejeitar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.rejeitarMorador(input.id);
      return { success: true };
    }),
  
  bloquear: protectedProcedure
    .input(z.object({ id: z.number(), motivo: z.string() }))
    .mutation(async ({ input }) => {
      await db.bloquearMorador(input.id, input.motivo);
      return { success: true };
    }),
  
  desbloquear: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.desbloquearMorador(input.id);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteMorador(input.id);
      return { success: true };
    }),
  
  // Importação em lote via Excel
  importarExcel: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      dados: z.array(z.object({
        linha: z.number(),
        nome: z.string(),
        email: z.string(),
        telefone: z.string().optional(),
        cpf: z.string().optional(),
        bloco: z.string(),
        unidade: z.string(),
        tipo: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const resultados: { linha: number; sucesso: boolean; erro?: string; moradorId?: number }[] = [];
      
      // Buscar blocos e unidades do condomínio
      const blocos = await db.getBlocosByCondominio(input.condominioId);
      const blocosMap = new Map(blocos.map(b => [b.nome.toLowerCase(), b]));
      
      // Buscar moradores existentes para verificar duplicatas
      const moradoresExistentes = await db.getMoradoresByCondominio(input.condominioId);
      const emailsExistentes = new Set(moradoresExistentes.map(m => m.email?.toLowerCase()).filter(Boolean));
      
      for (const item of input.dados) {
        try {
          // Validar email
          if (!item.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
            resultados.push({ linha: item.linha, sucesso: false, erro: 'Email inválido' });
            continue;
          }
          
          // Verificar duplicata de email
          if (emailsExistentes.has(item.email.toLowerCase())) {
            resultados.push({ linha: item.linha, sucesso: false, erro: 'Email já cadastrado' });
            continue;
          }
          
          // Buscar bloco
          const bloco = blocosMap.get(item.bloco.toLowerCase());
          if (!bloco) {
            resultados.push({ linha: item.linha, sucesso: false, erro: `Bloco "${item.bloco}" não encontrado` });
            continue;
          }
          
          // Buscar unidade
          const unidades = await db.getUnidadesByBloco(bloco.id);
          const unidade = unidades.find(u => u.numero.toLowerCase() === item.unidade.toLowerCase());
          if (!unidade) {
            resultados.push({ linha: item.linha, sucesso: false, erro: `Unidade "${item.unidade}" não encontrada no bloco "${item.bloco}"` });
            continue;
          }
          
          // Criar morador
          const tipo = ['proprietario', 'inquilino', 'dependente'].includes(item.tipo?.toLowerCase() || '')
            ? item.tipo?.toLowerCase() as 'proprietario' | 'inquilino' | 'dependente'
            : 'proprietario';
          
          const morador = await db.createMorador({
            condominioId: input.condominioId,
            unidadeId: unidade.id,
            nome: item.nome,
            email: item.email,
            telefone: item.telefone,
            cpf: item.cpf,
            tipo,
            status: 'aprovado',
          });
          
          emailsExistentes.add(item.email.toLowerCase());
          resultados.push({ linha: item.linha, sucesso: true, moradorId: morador.id });
        } catch (error) {
          resultados.push({ 
            linha: item.linha, 
            sucesso: false, 
            erro: error instanceof Error ? error.message : 'Erro desconhecido' 
          });
        }
      }
      
      const sucessos = resultados.filter(r => r.sucesso).length;
      const erros = resultados.filter(r => !r.sucesso).length;
      
      return {
        total: input.dados.length,
        sucessos,
        erros,
        resultados,
      };
    }),
  
  // Validar dados antes da importação
  validarImportacao: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      dados: z.array(z.object({
        linha: z.number(),
        nome: z.string(),
        email: z.string(),
        telefone: z.string().optional(),
        cpf: z.string().optional(),
        bloco: z.string(),
        unidade: z.string(),
        tipo: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const validacoes: { linha: number; valido: boolean; erros: string[] }[] = [];
      
      // Buscar blocos e unidades do condomínio
      const blocos = await db.getBlocosByCondominio(input.condominioId);
      const blocosMap = new Map(blocos.map(b => [b.nome.toLowerCase(), b]));
      
      // Cache de unidades por bloco
      const unidadesCache = new Map<number, Awaited<ReturnType<typeof db.getUnidadesByBloco>>>();
      
      // Buscar moradores existentes para verificar duplicatas
      const moradoresExistentes = await db.getMoradoresByCondominio(input.condominioId);
      const emailsExistentes = new Set(moradoresExistentes.map(m => m.email?.toLowerCase()).filter(Boolean));
      
      // Verificar duplicatas dentro do próprio arquivo
      const emailsNoArquivo = new Map<string, number>();
      
      for (const item of input.dados) {
        const erros: string[] = [];
        
        // Validar nome
        if (!item.nome || item.nome.trim().length < 2) {
          erros.push('Nome é obrigatório (mínimo 2 caracteres)');
        }
        
        // Validar email
        if (!item.email) {
          erros.push('Email é obrigatório');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
          erros.push('Formato de email inválido');
        } else {
          const emailLower = item.email.toLowerCase();
          // Verificar duplicata no banco
          if (emailsExistentes.has(emailLower)) {
            erros.push('Email já cadastrado no sistema');
          }
          // Verificar duplicata no arquivo
          const linhaAnterior = emailsNoArquivo.get(emailLower);
          if (linhaAnterior !== undefined) {
            erros.push(`Email duplicado (mesmo da linha ${linhaAnterior})`);
          } else {
            emailsNoArquivo.set(emailLower, item.linha);
          }
        }
        
        // Validar bloco
        if (!item.bloco) {
          erros.push('Bloco é obrigatório');
        } else {
          const bloco = blocosMap.get(item.bloco.toLowerCase());
          if (!bloco) {
            erros.push(`Bloco "${item.bloco}" não existe neste condomínio`);
          } else {
            // Validar unidade
            if (!item.unidade) {
              erros.push('Unidade é obrigatória');
            } else {
              let unidades = unidadesCache.get(bloco.id);
              if (!unidades) {
                unidades = await db.getUnidadesByBloco(bloco.id);
                unidadesCache.set(bloco.id, unidades);
              }
              const unidade = unidades.find(u => u.numero.toLowerCase() === item.unidade.toLowerCase());
              if (!unidade) {
                erros.push(`Unidade "${item.unidade}" não existe no bloco "${item.bloco}"`);
              }
            }
          }
        }
        
        // Validar tipo (opcional)
        if (item.tipo && !['proprietario', 'inquilino', 'dependente'].includes(item.tipo.toLowerCase())) {
          erros.push('Tipo deve ser: proprietario, inquilino ou dependente');
        }
        
        validacoes.push({
          linha: item.linha,
          valido: erros.length === 0,
          erros,
        });
      }
      
      const validos = validacoes.filter(v => v.valido).length;
      const invalidos = validacoes.filter(v => !v.valido).length;
      
      return {
        total: input.dados.length,
        validos,
        invalidos,
        validacoes,
      };
    }),
});

// ==================== ÁREAS COMUNS ROUTER ====================
const areasComunsRouter = router({
  list: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getAreasComunsByCondominio(input.condominioId);
    }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getAreaComumById(input.id);
    }),
  
  create: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      nome: z.string().min(1),
      descricao: z.string().optional(),
      icone: z.string().optional(),
      fotos: z.array(z.string()).optional(),
      regras: z.string().optional(),
      termoAceite: z.string().optional(),
      valor: z.string().optional(),
      capacidadeMaxima: z.number().optional(),
      diasMinimoAntecedencia: z.number().optional(),
      diasMaximoAntecedencia: z.number().optional(),
      diasMinimoCancelamento: z.number().optional(),
      limiteReservasPorHorario: z.number().optional(),
      limiteReservasPorDia: z.number().optional(),
      limiteReservasPorSemana: z.number().optional(),
      limiteReservasPorMes: z.number().optional(),
      limiteReservasPorAno: z.number().optional(),
      limiteUnidadePorHorario: z.number().optional(),
      limiteUnidadePorDia: z.number().optional(),
      limiteUnidadePorSemana: z.number().optional(),
      limiteUnidadePorMes: z.number().optional(),
      limiteUnidadePorAno: z.number().optional(),
      limiteMoradorPorHorario: z.number().optional(),
      limiteMoradorPorDia: z.number().optional(),
      limiteMoradorPorSemana: z.number().optional(),
      limiteMoradorPorMes: z.number().optional(),
      limiteMoradorPorAno: z.number().optional(),
      confirmacaoAutomatica: z.boolean().optional(),
      permitirMultiplasReservas: z.boolean().optional(),
      bloquearAposReserva: z.boolean().optional(),
      notificarAgendamento: z.boolean().optional(),
      notificarCancelamento: z.boolean().optional(),
      linkPagamento: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createAreaComum(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().min(1).optional(),
      descricao: z.string().optional(),
      icone: z.string().optional(),
      fotos: z.array(z.string()).optional(),
      regras: z.string().optional(),
      termoAceite: z.string().optional(),
      valor: z.string().optional(),
      capacidadeMaxima: z.number().optional(),
      diasMinimoAntecedencia: z.number().optional(),
      diasMaximoAntecedencia: z.number().optional(),
      diasMinimoCancelamento: z.number().optional(),
      limiteReservasPorHorario: z.number().optional(),
      limiteReservasPorDia: z.number().optional(),
      limiteReservasPorSemana: z.number().optional(),
      limiteReservasPorMes: z.number().optional(),
      limiteReservasPorAno: z.number().optional(),
      limiteUnidadePorHorario: z.number().optional(),
      limiteUnidadePorDia: z.number().optional(),
      limiteUnidadePorSemana: z.number().optional(),
      limiteUnidadePorMes: z.number().optional(),
      limiteUnidadePorAno: z.number().optional(),
      limiteMoradorPorHorario: z.number().optional(),
      limiteMoradorPorDia: z.number().optional(),
      limiteMoradorPorSemana: z.number().optional(),
      limiteMoradorPorMes: z.number().optional(),
      limiteMoradorPorAno: z.number().optional(),
      confirmacaoAutomatica: z.boolean().optional(),
      permitirMultiplasReservas: z.boolean().optional(),
      bloquearAposReserva: z.boolean().optional(),
      notificarAgendamento: z.boolean().optional(),
      notificarCancelamento: z.boolean().optional(),
      linkPagamento: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAreaComum(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAreaComum(input.id);
      return { success: true };
    }),
});

// ==================== FAIXAS DE HORÁRIO ROUTER ====================
const faixasHorarioRouter = router({
  list: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      return db.getFaixasHorarioByArea(input.areaId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      areaId: z.number(),
      horaInicio: z.string(),
      horaFim: z.string(),
      diasSemana: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createFaixaHorario(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      horaInicio: z.string().optional(),
      horaFim: z.string().optional(),
      diasSemana: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFaixaHorario(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteFaixaHorario(input.id);
      return { success: true };
    }),
});

// ==================== BLOQUEIOS ROUTER ====================
const bloqueiosRouter = router({
  list: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      return db.getBloqueiosByArea(input.areaId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      areaId: z.number(),
      tipo: z.enum(['dia_semana', 'data_especifica']),
      diasSemana: z.array(z.number()).optional(),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
      motivo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createBloqueio(input);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteBloqueio(input.id);
      return { success: true };
    }),
});

// ==================== ÁREAS COMPARTILHADAS ROUTER ====================
const areasCompartilhadasRouter = router({
  list: protectedProcedure
    .input(z.object({ areaPrincipalId: z.number() }))
    .query(async ({ input }) => {
      return db.getAreasCompartilhadas(input.areaPrincipalId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      areaPrincipalId: z.number(),
      areaVinculadaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      return db.createAreaCompartilhada(input);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAreaCompartilhada(input.id);
      return { success: true };
    }),
});

// ==================== LIMITES GLOBAIS ROUTER ====================
const limitesGlobaisRouter = router({
  get: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getLimiteGlobalByCondominio(input.condominioId);
    }),
  
  createOrUpdate: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      limiteGlobalUnidadePorDia: z.number().optional(),
      limiteGlobalUnidadePorSemana: z.number().optional(),
      limiteGlobalUnidadePorMes: z.number().optional(),
      limiteGlobalUnidadePorAno: z.number().optional(),
      limiteGlobalMoradorPorDia: z.number().optional(),
      limiteGlobalMoradorPorSemana: z.number().optional(),
      limiteGlobalMoradorPorMes: z.number().optional(),
      limiteGlobalMoradorPorAno: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.getLimiteGlobalByCondominio(input.condominioId);
      if (existing) {
        const { condominioId, ...data } = input;
        await db.updateLimiteGlobal(existing.id, data);
        return { id: existing.id };
      }
      return db.createLimiteGlobal(input);
    }),
});

// ==================== RESERVAS ROUTER ====================
const reservasRouter = router({
  list: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getReservasByCondominio(input.condominioId);
    }),
  
  listByArea: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      return db.getReservasByArea(input.areaId);
    }),
  
  listByMorador: protectedProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(async ({ input }) => {
      return db.getReservasByMorador(input.moradorId);
    }),
  
  listHoje: protectedProcedure
    .query(async ({ ctx }) => {
      // Buscar reservas de hoje para todos os condomínios que o usuário tem acesso
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return db.getReservasHoje(hoje, ctx.user);
    }),
  
  listByAreaAndDate: protectedProcedure
    .input(z.object({ areaId: z.number(), data: z.date() }))
    .query(async ({ input }) => {
      return db.getReservasByAreaAndDate(input.areaId, input.data);
    }),
  
  listPendentes: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getReservasPendentes(input.condominioId);
    }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getReservaById(input.id);
    }),
  
  getByProtocolo: protectedProcedure
    .input(z.object({ protocolo: z.string() }))
    .query(async ({ input }) => {
      return db.getReservaByProtocolo(input.protocolo);
    }),
  
  search: protectedProcedure
    .input(z.object({ condominioId: z.number(), query: z.string() }))
    .query(async ({ input }) => {
      return db.searchReservas(input.condominioId, input.query);
    }),
  
  create: protectedProcedure
    .input(z.object({
      areaId: z.number(),
      moradorId: z.number(),
      unidadeId: z.number(),
      condominioId: z.number(),
      dataReserva: z.date(),
      horaInicio: z.string(),
      horaFim: z.string(),
      quantidadePessoas: z.number().optional(),
      observacoes: z.string().optional(),
      termoAceito: z.boolean().optional(),
      assinaturaDigital: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o morador está bloqueado
      const morador = await db.getMoradorById(input.moradorId);
      if (!morador) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Morador não encontrado' });
      }
      if (morador.isBlocked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Morador bloqueado: ${morador.blockReason}` });
      }
      
      // Verificar configurações da área
      const area = await db.getAreaComumById(input.areaId);
      if (!area) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Área não encontrada' });
      }
      
      // Verificar se já existe reserva não utilizada (se bloquearAposReserva)
      if (area.bloquearAposReserva) {
        const hasReserva = await db.hasReservaNaoUtilizada(input.moradorId, input.areaId);
        if (hasReserva) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você já possui uma reserva pendente ou confirmada para esta área. Aguarde a utilização para fazer uma nova reserva.' });
        }
      }
      
      // Verificar limite de reservas por horário
      if (area.limiteReservasPorHorario && area.limiteReservasPorHorario > 0) {
        const count = await db.countReservasAreaHorario(input.areaId, input.dataReserva, input.horaInicio, input.horaFim);
        if (count >= area.limiteReservasPorHorario) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Limite de reservas para este horário atingido' });
        }
      }
      
      // Criar reserva
      const status = area.confirmacaoAutomatica ? 'confirmada' : 'pendente';
      const result = await db.createReserva({
        ...input,
        status,
        dataAceite: input.termoAceito ? new Date() : undefined,
      });
      
      // Criar timeline
      await db.createTimelineAcao({
        reservaId: result.id,
        userId: ctx.user.id,
        acao: 'criada',
        descricao: 'Reserva criada',
        perfilUsuario: ctx.user.role,
        nomeUsuario: ctx.user.name || 'Usuário',
      });
      
      if (status === 'confirmada') {
        await db.createTimelineAcao({
          reservaId: result.id,
          acao: 'confirmada',
          descricao: 'Reserva confirmada automaticamente',
          perfilUsuario: 'sistema',
          nomeUsuario: 'Sistema',
        });
      }
      
      // Enviar email de notificação
      const condominio = await db.getCondominioById(input.condominioId);
      const dataFormatada = new Date(input.dataReserva).toLocaleDateString('pt-BR');
      
      const emailData = status === 'confirmada'
        ? emailService.templateReservaConfirmada({
            moradorNome: morador.nome,
            moradorEmail: morador.email || ctx.user.email || '',
            areaNome: area.nome,
            data: dataFormatada,
            horarioInicio: input.horaInicio,
            horarioFim: input.horaFim,
            protocolo: result.protocolo,
            condominioNome: condominio?.nome || 'Condomínio',
            valor: area.valor ? parseFloat(area.valor) : undefined,
          })
        : emailService.templateReservaPendente({
            moradorNome: morador.nome,
            moradorEmail: morador.email || ctx.user.email || '',
            areaNome: area.nome,
            data: dataFormatada,
            horarioInicio: input.horaInicio,
            horarioFim: input.horaFim,
            protocolo: result.protocolo,
            condominioNome: condominio?.nome || 'Condomínio',
          });
      
      if (emailData.to) {
        await emailService.sendEmail(emailData);
      }
      
      // Notificar síndico se área tem valor
      if (area.valor && parseFloat(area.valor) > 0 && area.notificarAgendamento) {
        const sindico = await db.getSindicoByCondominio(input.condominioId);
        if (sindico?.email) {
          const sindicoEmail = emailService.templateNotificacaoSindico({
            sindicoNome: sindico.nome || 'Síndico',
            sindicoEmail: sindico.email,
            moradorNome: morador.nome,
            areaNome: area.nome,
            data: dataFormatada,
            horarioInicio: input.horaInicio,
            horarioFim: input.horaFim,
            protocolo: result.protocolo,
            condominioNome: condominio?.nome || 'Condomínio',
            valor: parseFloat(area.valor),
            tipo: 'nova_reserva',
          });
          await emailService.sendEmail(sindicoEmail);
        }
      }
      
      return result;
    }),
  
  confirmar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const reserva = await db.getReservaById(input.id);
      if (!reserva) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reserva não encontrada' });
      }
      
      await db.confirmarReserva(input.id);
      await db.createTimelineAcao({
        reservaId: input.id,
        userId: ctx.user.id,
        acao: 'confirmada',
        descricao: 'Reserva confirmada',
        perfilUsuario: ctx.user.role,
        nomeUsuario: ctx.user.name || 'Usuário',
      });
      
      // Enviar email de confirmação
      const morador = await db.getMoradorById(reserva.moradorId);
      const area = await db.getAreaComumById(reserva.areaId);
      const condominio = await db.getCondominioById(reserva.condominioId);
      
      if (morador?.email && area && condominio) {
        const dataFormatada = new Date(reserva.dataReserva).toLocaleDateString('pt-BR');
        const confirmacaoEmail = emailService.templateReservaConfirmada({
          moradorNome: morador.nome,
          moradorEmail: morador.email,
          areaNome: area.nome,
          data: dataFormatada,
          horarioInicio: reserva.horaInicio,
          horarioFim: reserva.horaFim,
          protocolo: reserva.protocolo,
          condominioNome: condominio.nome,
          valor: area.valor ? parseFloat(area.valor) : undefined,
        });
        await emailService.sendEmail(confirmacaoEmail);
      }
      
      return { success: true };
    }),
  
  cancelar: protectedProcedure
    .input(z.object({ id: z.number(), motivo: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const reserva = await db.getReservaById(input.id);
      if (!reserva) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reserva não encontrada' });
      }
      
      await db.cancelarReserva(input.id);
      await db.createTimelineAcao({
        reservaId: input.id,
        userId: ctx.user.id,
        acao: 'cancelada',
        descricao: input.motivo || 'Reserva cancelada',
        perfilUsuario: ctx.user.role,
        nomeUsuario: ctx.user.name || 'Usuário',
      });
      
      // Enviar email de cancelamento para o morador
      const morador = await db.getMoradorById(reserva.moradorId);
      const area = await db.getAreaComumById(reserva.areaId);
      const condominio = await db.getCondominioById(reserva.condominioId);
      
      if (morador?.email && area && condominio) {
        const dataFormatada = new Date(reserva.dataReserva).toLocaleDateString('pt-BR');
        const cancelamentoEmail = emailService.templateReservaCancelada({
          moradorNome: morador.nome,
          moradorEmail: morador.email,
          areaNome: area.nome,
          data: dataFormatada,
          horarioInicio: reserva.horaInicio,
          horarioFim: reserva.horaFim,
          protocolo: reserva.protocolo,
          condominioNome: condominio.nome,
        });
        await emailService.sendEmail(cancelamentoEmail);
      }
      
      // Notificar síndico se área tem valor
      if (area?.valor && parseFloat(area.valor) > 0 && area.notificarCancelamento) {
        const sindico = await db.getSindicoByCondominio(reserva.condominioId);
        if (sindico?.email && condominio && morador) {
          const dataFormatada = new Date(reserva.dataReserva).toLocaleDateString('pt-BR');
          const sindicoEmail = emailService.templateNotificacaoSindico({
            sindicoNome: sindico.nome || 'Síndico',
            sindicoEmail: sindico.email,
            moradorNome: morador.nome,
            areaNome: area.nome,
            data: dataFormatada,
            horarioInicio: reserva.horaInicio,
            horarioFim: reserva.horaFim,
            protocolo: reserva.protocolo,
            condominioNome: condominio.nome,
            valor: parseFloat(area.valor),
            tipo: 'cancelamento',
          });
          await emailService.sendEmail(sindicoEmail);
        }
      }
      
      // Notificar interessados em cancelamento
      const interessados = await db.getInteressadosByAreaAndDate(reserva.areaId, reserva.dataReserva);
      if (interessados.length > 0 && area && condominio) {
        const ids = interessados.map(i => i.id);
        await db.marcarInteressadosNotificados(ids);
        
        // Enviar emails para todos os interessados
        const dataFormatada = new Date(reserva.dataReserva).toLocaleDateString('pt-BR');
        for (const interessado of interessados) {
          const interesseEmail = emailService.templateInteresseCancelamento({
            moradorNome: '',
            moradorEmail: '',
            areaNome: area.nome,
            data: dataFormatada,
            horarioInicio: reserva.horaInicio,
            horarioFim: reserva.horaFim,
            protocolo: reserva.protocolo,
            condominioNome: condominio.nome,
            interessadoNome: 'Morador',
            interessadoEmail: interessado.email,
          });
          await emailService.sendEmail(interesseEmail);
        }
      }
      
      return { success: true };
    }),
  
  marcarUtilizada: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.marcarReservaUtilizada(input.id);
      await db.createTimelineAcao({
        reservaId: input.id,
        userId: ctx.user.id,
        acao: 'utilizada',
        descricao: 'Reserva marcada como utilizada',
        perfilUsuario: ctx.user.role,
        nomeUsuario: ctx.user.name || 'Usuário',
      });
      return { success: true };
    }),

  // Check-in via QR Code ou protocolo
  checkin: protectedProcedure
    .input(z.object({ protocolo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reserva = await db.getReservaByProtocolo(input.protocolo);
      if (!reserva) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reserva não encontrada' });
      }

      // Verificar se reserva está confirmada
      if (reserva.status !== 'confirmada') {
        if (reserva.status === 'pendente') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Reserva ainda não foi aprovada' });
        }
        if (reserva.status === 'cancelada') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Reserva foi cancelada' });
        }
        if (reserva.status === 'utilizada') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Check-in já foi realizado para esta reserva' });
        }
      }

      // Verificar se é o dia da reserva
      const hoje = new Date();
      const dataReserva = new Date(reserva.dataReserva);
      hoje.setHours(0, 0, 0, 0);
      dataReserva.setHours(0, 0, 0, 0);
      
      if (hoje.getTime() !== dataReserva.getTime()) {
        const diffDays = Math.ceil((dataReserva.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: `Check-in só pode ser feito no dia da reserva. Faltam ${diffDays} dia(s).` });
        } else {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'A data da reserva já passou' });
        }
      }

      // Marcar como utilizada
      await db.marcarReservaUtilizada(reserva.id);
      await db.createTimelineAcao({
        reservaId: reserva.id,
        userId: ctx.user.id,
        acao: 'utilizada',
        descricao: 'Check-in realizado via QR Code',
        perfilUsuario: ctx.user.role,
        nomeUsuario: ctx.user.name || 'Usuário',
      });

      // Buscar dados completos para retorno
      const morador = await db.getMoradorById(reserva.moradorId);
      const area = await db.getAreaComumById(reserva.areaId);

      return {
        success: true,
        reserva: {
          protocolo: reserva.protocolo,
          areaNome: area?.nome || 'Área',
          moradorNome: morador?.nome || 'Morador',
          dataReserva: new Date(reserva.dataReserva).toLocaleDateString('pt-BR'),
          horaInicio: reserva.horaInicio,
          horaFim: reserva.horaFim,
          status: 'utilizada'
        }
      };
    }),

  // Buscar reserva por protocolo (mutation para o scanner)
  getByProtocolo: protectedProcedure
    .input(z.object({ protocolo: z.string() }))
    .mutation(async ({ input }) => {
      const reserva = await db.getReservaByProtocolo(input.protocolo);
      if (!reserva) {
        return null;
      }

      const morador = await db.getMoradorById(reserva.moradorId);
      const area = await db.getAreaComumById(reserva.areaId);

      return {
        ...reserva,
        morador: morador ? { nome: morador.nome } : null,
        area: area ? { nome: area.nome } : null
      };
    }),
});

// ==================== TIMELINE ROUTER ====================
const timelineRouter = router({
  list: protectedProcedure
    .input(z.object({ reservaId: z.number() }))
    .query(async ({ input }) => {
      return db.getTimelineByReserva(input.reservaId);
    }),
});

// ==================== INTERESSE CANCELAMENTO ROUTER ====================
const interesseCancelamentoRouter = router({
  create: protectedProcedure
    .input(z.object({
      areaId: z.number(),
      moradorId: z.number(),
      dataInteresse: z.date(),
      horaInicio: z.string().optional(),
      horaFim: z.string().optional(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      return db.createInteresseCancelamento(input);
    }),
});

// ==================== NOTIFICAÇÕES ROUTER ====================
const notificacoesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getNotificacoesByUser(ctx.user.id);
  }),
  
  listNaoLidas: protectedProcedure.query(async ({ ctx }) => {
    return db.getNotificacoesNaoLidas(ctx.user.id);
  }),
  
  marcarLida: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.marcarNotificacaoLida(input.id);
      return { success: true };
    }),
  
  marcarTodasLidas: protectedProcedure.mutation(async ({ ctx }) => {
    await db.marcarTodasNotificacoesLidas(ctx.user.id);
    return { success: true };
  }),
});

// ==================== USERS ROUTER (Admin) ====================
const usersRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getUserById(input.id);
    }),
  
  updateRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['super_admin', 'administradora', 'sindico', 'morador']),
    }))
    .mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),
  
  bloquear: adminProcedure
    .input(z.object({ userId: z.number(), motivo: z.string() }))
    .mutation(async ({ input }) => {
      await db.blockUser(input.userId, input.motivo);
      return { success: true };
    }),
  
  desbloquear: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await db.unblockUser(input.userId);
      return { success: true };
    }),
});

// ==================== RELATÓRIOS ROUTER ====================
const relatoriosRouter = router({
  // Dados para relatório
  getDados: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      dataInicio: z.date(),
      dataFim: z.date(),
      areaId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const reservas = await db.getReservasParaRelatorio(
        input.condominioId,
        input.dataInicio,
        input.dataFim,
        input.areaId
      );
      const estatisticasAreas = await db.getEstatisticasPorArea(
        input.condominioId,
        input.dataInicio,
        input.dataFim
      );
      const estatisticasPeriodo = await db.getEstatisticasPorPeriodo(
        input.condominioId,
        input.dataInicio,
        input.dataFim,
        'mes'
      );
      
      return {
        reservas,
        estatisticasAreas,
        estatisticasPeriodo,
      };
    }),
  
  // Estatísticas por área
  estatisticasPorArea: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      dataInicio: z.date(),
      dataFim: z.date(),
    }))
    .query(async ({ input }) => {
      return db.getEstatisticasPorArea(
        input.condominioId,
        input.dataInicio,
        input.dataFim
      );
    }),
  
  // Estatísticas por período
  estatisticasPorPeriodo: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      dataInicio: z.date(),
      dataFim: z.date(),
      agrupamento: z.enum(['dia', 'semana', 'mes']),
    }))
    .query(async ({ input }) => {
      return db.getEstatisticasPorPeriodo(
        input.condominioId,
        input.dataInicio,
        input.dataFim,
        input.agrupamento
      );
    }),
});

// ==================== PUSH NOTIFICATIONS ROUTER ====================
const pushRouter = router({
  // Obter chave pública VAPID
  getVapidKey: publicProcedure.query(() => {
    return { publicKey: pushService.getVapidPublicKey() };
  }),

  // Registrar subscription
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
      deviceType: z.string().optional(),
      deviceName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await pushService.saveSubscription(
        ctx.user.id,
        { endpoint: input.endpoint, keys: input.keys },
        input.deviceType,
        input.deviceName
      );
      return { success };
    }),

  // Remover subscription
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      const success = await pushService.removeSubscription(input.endpoint);
      return { success };
    }),

  // Obter preferências de notificação
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return pushService.getNotificationPreferences(ctx.user.id);
  }),

  // Atualizar preferências de notificação
  updatePreferences: protectedProcedure
    .input(z.object({
      pushEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      notificarNovaReserva: z.boolean().optional(),
      notificarConfirmacao: z.boolean().optional(),
      notificarCancelamento: z.boolean().optional(),
      notificarLembrete: z.boolean().optional(),
      notificarCadastro: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await pushService.updateNotificationPreferences(ctx.user.id, input);
      return { success };
    }),

  // Enviar notificação de teste
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await pushService.sendPushNotification(
      ctx.user.id,
      {
        title: '🔔 Teste de Notificação',
        body: 'Se você está vendo isso, as notificações estão funcionando!',
        tag: 'test',
        data: { url: '/dashboard' },
      }
    );
    return result;
  }),
});

// ==================== CHAVES ROUTER ====================
const chavesRouter = router({
  // Listar chaves de um condomínio
  list: protectedProcedure
    .input(z.object({
      condominioId: z.number(),
      areaId: z.number().optional(),
      status: z.enum(["disponivel", "em_uso", "perdida", "manutencao"]).optional(),
    }))
    .query(async ({ input }) => {
      return db.getChaves(input.condominioId, input.areaId, input.status);
    }),

  // Obter chave por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getChaveById(input.id);
    }),

  // Criar nova chave
  create: protectedProcedure
    .input(z.object({
      areaId: z.number(),
      condominioId: z.number(),
      identificacao: z.string().min(1, "Identificação obrigatória"),
      descricao: z.string().optional(),
      quantidade: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      return db.createChave(input);
    }),

  // Atualizar chave
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      identificacao: z.string().optional(),
      descricao: z.string().optional(),
      quantidade: z.number().optional(),
      status: z.enum(["disponivel", "em_uso", "perdida", "manutencao"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateChave(id, data);
    }),

  // Excluir chave
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return db.deleteChave(input.id);
    }),

  // Registrar retirada de chave
  retirar: protectedProcedure
    .input(z.object({
      chaveId: z.number(),
      moradorId: z.number(),
      condominioId: z.number(),
      reservaId: z.number().optional(),
      responsavelNome: z.string().optional(),
      observacoes: z.string().optional(),
      fotoDocumento: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se a chave está disponível
      const chave = await db.getChaveById(input.chaveId);
      if (!chave) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Chave não encontrada' });
      }
      if (chave.status !== 'disponivel') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Chave não está disponível para retirada' });
      }

      // Registrar movimentação
      const movimentacao = await db.createMovimentacaoChave({
        chaveId: input.chaveId,
        moradorId: input.moradorId,
        condominioId: input.condominioId,
        reservaId: input.reservaId,
        tipo: 'retirada',
        responsavelId: ctx.user.id,
        responsavelNome: input.responsavelNome || ctx.user.name || 'Sistema',
        observacoes: input.observacoes,
        fotoDocumento: input.fotoDocumento,
      });

      // Atualizar status da chave
      await db.updateChave(input.chaveId, { status: 'em_uso' });

      return movimentacao;
    }),

  // Registrar devolução de chave
  devolver: protectedProcedure
    .input(z.object({
      chaveId: z.number(),
      moradorId: z.number(),
      condominioId: z.number(),
      reservaId: z.number().optional(),
      responsavelNome: z.string().optional(),
      observacoes: z.string().optional(),
      fotoDocumento: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se a chave está em uso
      const chave = await db.getChaveById(input.chaveId);
      if (!chave) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Chave não encontrada' });
      }
      if (chave.status !== 'em_uso') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Chave não está em uso' });
      }

      // Registrar movimentação
      const movimentacao = await db.createMovimentacaoChave({
        chaveId: input.chaveId,
        moradorId: input.moradorId,
        condominioId: input.condominioId,
        reservaId: input.reservaId,
        tipo: 'devolucao',
        responsavelId: ctx.user.id,
        responsavelNome: input.responsavelNome || ctx.user.name || 'Sistema',
        observacoes: input.observacoes,
        fotoDocumento: input.fotoDocumento,
      });

      // Atualizar status da chave
      await db.updateChave(input.chaveId, { status: 'disponivel' });

      return movimentacao;
    }),

  // Histórico de movimentação de uma chave
  historico: protectedProcedure
    .input(z.object({
      chaveId: z.number().optional(),
      condominioId: z.number(),
      moradorId: z.number().optional(),
      tipo: z.enum(["retirada", "devolucao"]).optional(),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
    }))
    .query(async ({ input }) => {
      return db.getHistoricoChaves(input);
    }),

  // Chaves pendentes de devolução
  pendentes: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getChavesPendentes(input.condominioId);
    }),

  // Relatório de chaves em posse de moradores
  relatorio: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getRelatorioChaves(input.condominioId);
    }),
});

// ==================== AVALIAÇÕES ROUTER ====================
const avaliacoesRouter = router({
  // Criar avaliação
  create: protectedProcedure
    .input(z.object({
      reservaId: z.number(),
      moradorId: z.number(),
      areaId: z.number(),
      condominioId: z.number(),
      notaGeral: z.number().min(1).max(5),
      notaLimpeza: z.number().min(1).max(5).optional(),
      notaConservacao: z.number().min(1).max(5).optional(),
      notaAtendimento: z.number().min(1).max(5).optional(),
      comentario: z.string().optional(),
      recomendaria: z.boolean().default(true),
      problemaReportado: z.boolean().default(false),
      descricaoProblema: z.string().optional(),
      isPublica: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // Verificar se já existe avaliação para esta reserva
      const existente = await db.getAvaliacaoByReserva(input.reservaId);
      if (existente) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Já existe uma avaliação para esta reserva' });
      }
      return db.createAvaliacao(input);
    }),

  // Buscar avaliação por reserva
  getByReserva: protectedProcedure
    .input(z.object({ reservaId: z.number() }))
    .query(async ({ input }) => {
      return db.getAvaliacaoByReserva(input.reservaId);
    }),

  // Listar avaliações por área
  listByArea: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      return db.getAvaliacoesByArea(input.areaId);
    }),

  // Listar avaliações por condomínio
  listByCondominio: protectedProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return db.getAvaliacoesByCondominio(input.condominioId);
    }),

  // Média de avaliação por área
  mediaByArea: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      return db.getMediaAvaliacaoArea(input.areaId);
    }),

  // Responder avaliação (síndico)
  responder: protectedProcedure
    .input(z.object({
      id: z.number(),
      resposta: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      await db.responderAvaliacao(input.id, input.resposta);
      return { success: true };
    }),

  // Reservas pendentes de avaliação
  pendentes: protectedProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(async ({ input }) => {
      return db.getReservasSemAvaliacao(input.moradorId);
    }),
});

// ==================== APP ROUTER ====================
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  condominios: condominiosRouter,
  blocos: blocosRouter,
  unidades: unidadesRouter,
  moradores: moradoresRouter,
  areasComuns: areasComunsRouter,
  faixasHorario: faixasHorarioRouter,
  bloqueios: bloqueiosRouter,
  areasCompartilhadas: areasCompartilhadasRouter,
  limitesGlobais: limitesGlobaisRouter,
  reservas: reservasRouter,
  timeline: timelineRouter,
  interesseCancelamento: interesseCancelamentoRouter,
  notificacoes: notificacoesRouter,
  relatorios: relatoriosRouter,
  push: pushRouter,
  chaves: chavesRouter,
  avaliacoes: avaliacoesRouter,
});

export type AppRouter = typeof appRouter;
