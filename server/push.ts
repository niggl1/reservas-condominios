import webpush from 'web-push';
import { getDb } from './db';
import { pushTokens, preferenciaNotificacoes } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Configuração do VAPID (Voluntary Application Server Identification)
// Em produção, estas chaves devem ser geradas uma vez e armazenadas como variáveis de ambiente
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@reservas.app';

// Configurar web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Exportar chave pública para o frontend
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

// Interface para subscription do navegador
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Tipos de notificação push
export type PushNotificationType = 
  | 'reserva_criada'
  | 'reserva_confirmada'
  | 'reserva_cancelada'
  | 'lembrete'
  | 'cadastro_aprovado'
  | 'cancelamento_disponivel';

// Interface para payload de notificação
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: PushNotificationType;
    reservaId?: number;
  };
  actions?: Array<{
    action: string;
    title: string;
  }>;
  requireInteraction?: boolean;
}

// Salvar subscription do usuário
export async function saveSubscription(
  userId: number,
  subscription: PushSubscription,
  deviceType?: string,
  deviceName?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Verificar se já existe uma subscription com este endpoint
    const existing = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar subscription existente
      await db.update(pushTokens)
        .set({
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          deviceType,
          deviceName,
          isActive: true,
          lastUsed: new Date(),
        })
        .where(eq(pushTokens.endpoint, subscription.endpoint));
    } else {
      // Criar nova subscription
      await db.insert(pushTokens).values({
        userId,
        token: subscription.endpoint, // Usando endpoint como token único
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceType,
        deviceName,
        isActive: true,
        lastUsed: new Date(),
      });
    }

    // Criar preferências de notificação padrão se não existirem
    const prefs = await db.select()
      .from(preferenciaNotificacoes)
      .where(eq(preferenciaNotificacoes.userId, userId))
      .limit(1);

    if (prefs.length === 0) {
      await db.insert(preferenciaNotificacoes).values({
        userId,
        pushEnabled: true,
        emailEnabled: true,
        notificarNovaReserva: true,
        notificarConfirmacao: true,
        notificarCancelamento: true,
        notificarLembrete: true,
        notificarCadastro: true,
      });
    }

    return true;
  } catch (error) {
    console.error('[Push] Erro ao salvar subscription:', error);
    return false;
  }
}

// Remover subscription do usuário
export async function removeSubscription(endpoint: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(pushTokens)
      .where(eq(pushTokens.endpoint, endpoint));
    return true;
  } catch (error) {
    console.error('[Push] Erro ao remover subscription:', error);
    return false;
  }
}

// Enviar notificação push para um usuário
export async function sendPushNotification(
  userId: number,
  payload: PushPayload,
  notificationType?: PushNotificationType
): Promise<{ success: boolean; sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { success: false, sent: 0, failed: 0 };

  try {
    // Verificar preferências do usuário
    const prefs = await db.select()
      .from(preferenciaNotificacoes)
      .where(eq(preferenciaNotificacoes.userId, userId))
      .limit(1);

    if (prefs.length > 0) {
      const pref = prefs[0];
      
      // Verificar se push está habilitado
      if (!pref.pushEnabled) {
        console.log('[Push] Notificações push desabilitadas para usuário:', userId);
        return { success: true, sent: 0, failed: 0 };
      }

      // Verificar preferência específica do tipo de notificação
      if (notificationType) {
        const prefMap: Record<PushNotificationType, boolean> = {
          'reserva_criada': pref.notificarNovaReserva,
          'reserva_confirmada': pref.notificarConfirmacao,
          'reserva_cancelada': pref.notificarCancelamento,
          'lembrete': pref.notificarLembrete,
          'cadastro_aprovado': pref.notificarCadastro,
          'cancelamento_disponivel': pref.notificarCancelamento,
        };

        if (!prefMap[notificationType]) {
          console.log('[Push] Tipo de notificação desabilitado:', notificationType);
          return { success: true, sent: 0, failed: 0 };
        }
      }
    }

    // Buscar todas as subscriptions ativas do usuário
    const subscriptions = await db.select()
      .from(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.isActive, true)
      ));

    if (subscriptions.length === 0) {
      console.log('[Push] Nenhuma subscription ativa para usuário:', userId);
      return { success: true, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Enviar para todas as subscriptions
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const pushPayload = JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
        });

        await webpush.sendNotification(pushSubscription, pushPayload);
        
        // Atualizar último uso
        await db.update(pushTokens)
          .set({ lastUsed: new Date() })
          .where(eq(pushTokens.id, sub.id));
        
        sent++;
      } catch (error: any) {
        console.error('[Push] Erro ao enviar notificação:', error);
        
        // Se a subscription expirou ou é inválida, desativar
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.update(pushTokens)
            .set({ isActive: false })
            .where(eq(pushTokens.id, sub.id));
        }
        
        failed++;
      }
    }

    return { success: true, sent, failed };
  } catch (error) {
    console.error('[Push] Erro ao enviar notificações:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

// Enviar notificação para múltiplos usuários
export async function sendPushToMultipleUsers(
  userIds: number[],
  payload: PushPayload,
  notificationType?: PushNotificationType
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload, notificationType);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { success: true, totalSent, totalFailed };
}

// Obter preferências de notificação do usuário
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const prefs = await db.select()
      .from(preferenciaNotificacoes)
      .where(eq(preferenciaNotificacoes.userId, userId))
      .limit(1);

    if (prefs.length === 0) {
      // Retornar preferências padrão
      return {
        pushEnabled: true,
        emailEnabled: true,
        notificarNovaReserva: true,
        notificarConfirmacao: true,
        notificarCancelamento: true,
        notificarLembrete: true,
        notificarCadastro: true,
      };
    }

    return prefs[0];
  } catch (error) {
    console.error('[Push] Erro ao buscar preferências:', error);
    return null;
  }
}

// Atualizar preferências de notificação
export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    notificarNovaReserva: boolean;
    notificarConfirmacao: boolean;
    notificarCancelamento: boolean;
    notificarLembrete: boolean;
    notificarCadastro: boolean;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await db.select()
      .from(preferenciaNotificacoes)
      .where(eq(preferenciaNotificacoes.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      // Criar com valores padrão + preferências fornecidas
      await db.insert(preferenciaNotificacoes).values({
        userId,
        pushEnabled: preferences.pushEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? true,
        notificarNovaReserva: preferences.notificarNovaReserva ?? true,
        notificarConfirmacao: preferences.notificarConfirmacao ?? true,
        notificarCancelamento: preferences.notificarCancelamento ?? true,
        notificarLembrete: preferences.notificarLembrete ?? true,
        notificarCadastro: preferences.notificarCadastro ?? true,
      });
    } else {
      // Atualizar existente
      await db.update(preferenciaNotificacoes)
        .set(preferences)
        .where(eq(preferenciaNotificacoes.userId, userId));
    }

    return true;
  } catch (error) {
    console.error('[Push] Erro ao atualizar preferências:', error);
    return false;
  }
}

// Templates de notificação
export const pushTemplates = {
  reservaCriada: (areaNome: string, data: string, hora: string): PushPayload => ({
    title: '📅 Nova Reserva Criada',
    body: `Sua reserva para ${areaNome} em ${data} às ${hora} foi criada e está aguardando confirmação.`,
    tag: 'reserva-criada',
    data: { type: 'reserva_criada' },
    actions: [
      { action: 'open', title: 'Ver Reserva' },
      { action: 'close', title: 'Fechar' },
    ],
  }),

  reservaConfirmada: (areaNome: string, data: string, hora: string): PushPayload => ({
    title: '✅ Reserva Confirmada',
    body: `Sua reserva para ${areaNome} em ${data} às ${hora} foi confirmada!`,
    tag: 'reserva-confirmada',
    data: { type: 'reserva_confirmada' },
    actions: [
      { action: 'open', title: 'Ver Detalhes' },
      { action: 'close', title: 'Fechar' },
    ],
  }),

  reservaCancelada: (areaNome: string, data: string, hora: string): PushPayload => ({
    title: '❌ Reserva Cancelada',
    body: `Sua reserva para ${areaNome} em ${data} às ${hora} foi cancelada.`,
    tag: 'reserva-cancelada',
    data: { type: 'reserva_cancelada' },
    actions: [
      { action: 'open', title: 'Nova Reserva' },
      { action: 'close', title: 'Fechar' },
    ],
  }),

  lembrete: (areaNome: string, data: string, hora: string): PushPayload => ({
    title: '⏰ Lembrete de Reserva',
    body: `Sua reserva para ${areaNome} é amanhã, ${data} às ${hora}. Não esqueça!`,
    tag: 'lembrete',
    data: { type: 'lembrete' },
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ver Detalhes' },
      { action: 'close', title: 'OK' },
    ],
  }),

  cadastroAprovado: (condominioNome: string): PushPayload => ({
    title: '🎉 Cadastro Aprovado',
    body: `Seu cadastro no ${condominioNome} foi aprovado! Você já pode fazer reservas.`,
    tag: 'cadastro-aprovado',
    data: { type: 'cadastro_aprovado', url: '/nova-reserva' },
    actions: [
      { action: 'open', title: 'Fazer Reserva' },
      { action: 'close', title: 'Fechar' },
    ],
  }),

  cancelamentoDisponivel: (areaNome: string, data: string, hora: string): PushPayload => ({
    title: '🔔 Vaga Disponível',
    body: `Uma vaga ficou disponível para ${areaNome} em ${data} às ${hora}. Reserve agora!`,
    tag: 'cancelamento-disponivel',
    data: { type: 'cancelamento_disponivel', url: '/nova-reserva' },
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Reservar Agora' },
      { action: 'close', title: 'Ignorar' },
    ],
  }),

  novaReservaPendente: (moradorNome: string, areaNome: string): PushPayload => ({
    title: '📋 Nova Reserva Pendente',
    body: `${moradorNome} solicitou reserva para ${areaNome}. Aguardando sua aprovação.`,
    tag: 'reserva-pendente',
    data: { type: 'reserva_criada', url: '/aprovacoes' },
    actions: [
      { action: 'open', title: 'Aprovar' },
      { action: 'close', title: 'Ver Depois' },
    ],
  }),
};
