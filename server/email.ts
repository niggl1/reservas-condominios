import { ENV } from "./_core/env";

// ============================================
// TIPOS E INTERFACES
// ============================================

export type EmailTemplate = 
  | "reserva_confirmada"
  | "reserva_cancelada"
  | "reserva_pendente"
  | "lembrete_reserva"
  | "recuperar_senha"
  | "boas_vindas"
  | "cadastro_aprovado"
  | "cadastro_rejeitado"
  | "notificacao_sindico"
  | "interesse_cancelamento";

export interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ReservaEmailData {
  moradorNome: string;
  moradorEmail: string;
  areaNome: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  protocolo: string;
  condominioNome: string;
  valor?: number;
  status?: string;
}

export interface RecuperarSenhaEmailData {
  nome: string;
  email: string;
  token: string;
  baseUrl: string;
}

export interface BoasVindasEmailData {
  nome: string;
  email: string;
  condominioNome: string;
  role: string;
}

export interface NotificacaoSindicoEmailData {
  sindicoNome: string;
  sindicoEmail: string;
  moradorNome: string;
  areaNome: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  protocolo: string;
  condominioNome: string;
  valor: number;
  tipo: "nova_reserva" | "cancelamento";
}

// ============================================
// ESTILOS BASE DOS EMAILS
// ============================================

const emailStyles = `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
    background-color: #f5f5f5; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: #ffffff; 
    border-radius: 12px; 
    overflow: hidden; 
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
  }
  .header { 
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); 
    color: white; 
    padding: 30px 20px; 
    text-align: center; 
  }
  .header h1 { 
    margin: 0; 
    font-size: 24px; 
    font-weight: 600; 
  }
  .header .subtitle { 
    margin-top: 8px; 
    opacity: 0.9; 
    font-size: 14px; 
  }
  .content { 
    padding: 30px; 
  }
  .greeting { 
    font-size: 18px; 
    color: #0d9488; 
    margin-bottom: 20px; 
  }
  .info-box { 
    background: #f0fdfa; 
    border-left: 4px solid #0d9488; 
    padding: 20px; 
    margin: 20px 0; 
    border-radius: 0 8px 8px 0; 
  }
  .info-row { 
    display: flex; 
    margin-bottom: 12px; 
  }
  .info-label { 
    font-weight: 600; 
    color: #666; 
    width: 140px; 
    flex-shrink: 0; 
  }
  .info-value { 
    color: #333; 
  }
  .protocol { 
    background: #0d9488; 
    color: white; 
    padding: 15px 25px; 
    border-radius: 8px; 
    text-align: center; 
    margin: 20px 0; 
  }
  .protocol-label { 
    font-size: 12px; 
    text-transform: uppercase; 
    letter-spacing: 1px; 
    opacity: 0.9; 
  }
  .protocol-number { 
    font-size: 28px; 
    font-weight: 700; 
    letter-spacing: 3px; 
    margin-top: 5px; 
  }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); 
    color: white !important; 
    padding: 14px 30px; 
    text-decoration: none; 
    border-radius: 8px; 
    font-weight: 600; 
    margin: 20px 0; 
  }
  .button:hover { 
    opacity: 0.9; 
  }
  .warning-box { 
    background: #fef3c7; 
    border-left: 4px solid #f59e0b; 
    padding: 15px 20px; 
    margin: 20px 0; 
    border-radius: 0 8px 8px 0; 
    color: #92400e; 
  }
  .success-box { 
    background: #d1fae5; 
    border-left: 4px solid #10b981; 
    padding: 15px 20px; 
    margin: 20px 0; 
    border-radius: 0 8px 8px 0; 
    color: #065f46; 
  }
  .error-box { 
    background: #fee2e2; 
    border-left: 4px solid #ef4444; 
    padding: 15px 20px; 
    margin: 20px 0; 
    border-radius: 0 8px 8px 0; 
    color: #991b1b; 
  }
  .footer { 
    background: #f8fafc; 
    padding: 20px; 
    text-align: center; 
    font-size: 12px; 
    color: #64748b; 
    border-top: 1px solid #e2e8f0; 
  }
  .footer a { 
    color: #0d9488; 
    text-decoration: none; 
  }
  .divider { 
    height: 1px; 
    background: #e2e8f0; 
    margin: 25px 0; 
  }
  .status-badge { 
    display: inline-block; 
    padding: 6px 16px; 
    border-radius: 20px; 
    font-size: 13px; 
    font-weight: 600; 
    text-transform: uppercase; 
  }
  .status-confirmada { 
    background: #d1fae5; 
    color: #065f46; 
  }
  .status-pendente { 
    background: #fef3c7; 
    color: #92400e; 
  }
  .status-cancelada { 
    background: #fee2e2; 
    color: #991b1b; 
  }
`;

// ============================================
// TEMPLATES DE EMAIL
// ============================================

function wrapTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div style="padding: 20px; background-color: #f5f5f5;">
    <div class="container">
      ${content}
    </div>
  </div>
</body>
</html>
`;
}

// Template: Reserva Confirmada
export function templateReservaConfirmada(data: ReservaEmailData): EmailData {
  const content = `
    <div class="header">
      <h1>✅ Reserva Confirmada</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.moradorNome}!</p>
      <p>Sua reserva foi <strong>confirmada</strong> com sucesso. Confira os detalhes abaixo:</p>
      
      <div class="protocol">
        <div class="protocol-label">Protocolo da Reserva</div>
        <div class="protocol-number">${data.protocolo}</div>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
        ${data.valor ? `
        <div class="info-row">
          <span class="info-label">Valor:</span>
          <span class="info-value">R$ ${data.valor.toFixed(2)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="success-box">
        <strong>Importante:</strong> Apresente o protocolo da reserva no momento da utilização do espaço.
      </div>
      
      <div class="divider"></div>
      <p style="color: #64748b; font-size: 14px;">
        Em caso de dúvidas ou necessidade de cancelamento, entre em contato com a administração do condomínio.
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.moradorEmail,
    toName: data.moradorNome,
    subject: `✅ Reserva Confirmada - ${data.areaNome} - ${data.data}`,
    html: wrapTemplate(content, "Reserva Confirmada"),
    text: `Olá ${data.moradorNome}, sua reserva foi confirmada! Área: ${data.areaNome}, Data: ${data.data}, Horário: ${data.horarioInicio} às ${data.horarioFim}. Protocolo: ${data.protocolo}`,
  };
}

// Template: Reserva Pendente
export function templateReservaPendente(data: ReservaEmailData): EmailData {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
      <h1>⏳ Reserva Pendente</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.moradorNome}!</p>
      <p>Sua solicitação de reserva foi recebida e está <strong>aguardando aprovação</strong>.</p>
      
      <div class="protocol">
        <div class="protocol-label">Protocolo da Reserva</div>
        <div class="protocol-number">${data.protocolo}</div>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value"><span class="status-badge status-pendente">Pendente</span></span>
        </div>
      </div>
      
      <div class="warning-box">
        <strong>Atenção:</strong> Você receberá um email assim que sua reserva for aprovada ou recusada pela administração.
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.moradorEmail,
    toName: data.moradorNome,
    subject: `⏳ Reserva Pendente - ${data.areaNome} - ${data.data}`,
    html: wrapTemplate(content, "Reserva Pendente"),
    text: `Olá ${data.moradorNome}, sua reserva está pendente de aprovação. Área: ${data.areaNome}, Data: ${data.data}. Protocolo: ${data.protocolo}`,
  };
}

// Template: Reserva Cancelada
export function templateReservaCancelada(data: ReservaEmailData): EmailData {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);">
      <h1>❌ Reserva Cancelada</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.moradorNome}!</p>
      <p>Informamos que sua reserva foi <strong>cancelada</strong>.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Protocolo:</span>
          <span class="info-value">${data.protocolo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
      </div>
      
      <p style="color: #64748b;">
        Se você não solicitou este cancelamento ou tem alguma dúvida, entre em contato com a administração do condomínio.
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.moradorEmail,
    toName: data.moradorNome,
    subject: `❌ Reserva Cancelada - ${data.areaNome} - ${data.data}`,
    html: wrapTemplate(content, "Reserva Cancelada"),
    text: `Olá ${data.moradorNome}, sua reserva foi cancelada. Área: ${data.areaNome}, Data: ${data.data}. Protocolo: ${data.protocolo}`,
  };
}

// Template: Lembrete de Reserva
export function templateLembreteReserva(data: ReservaEmailData): EmailData {
  const content = `
    <div class="header">
      <h1>🔔 Lembrete de Reserva</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.moradorNome}!</p>
      <p>Este é um lembrete da sua reserva que acontecerá <strong>amanhã</strong>.</p>
      
      <div class="protocol">
        <div class="protocol-label">Protocolo da Reserva</div>
        <div class="protocol-number">${data.protocolo}</div>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
      </div>
      
      <div class="success-box">
        <strong>Dica:</strong> Não esqueça de levar o protocolo da reserva para apresentar no momento da utilização.
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.moradorEmail,
    toName: data.moradorNome,
    subject: `🔔 Lembrete: Reserva Amanhã - ${data.areaNome}`,
    html: wrapTemplate(content, "Lembrete de Reserva"),
    text: `Olá ${data.moradorNome}, lembrete da sua reserva amanhã! Área: ${data.areaNome}, Data: ${data.data}, Horário: ${data.horarioInicio} às ${data.horarioFim}. Protocolo: ${data.protocolo}`,
  };
}

// Template: Recuperar Senha
export function templateRecuperarSenha(data: RecuperarSenhaEmailData): EmailData {
  const resetUrl = `${data.baseUrl}/recuperar-senha?token=${data.token}`;
  
  const content = `
    <div class="header">
      <h1>🔐 Recuperação de Senha</h1>
      <div class="subtitle">Sistema de Reservas</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.nome}!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
      </p>
      
      <div class="warning-box">
        <strong>Atenção:</strong> Este link é válido por <strong>1 hora</strong>. Após esse período, será necessário solicitar um novo link.
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #64748b; font-size: 14px;">
        Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.
      </p>
      
      <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
        Caso o botão não funcione, copie e cole o link abaixo no seu navegador:<br>
        <a href="${resetUrl}" style="color: #0d9488; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>Por segurança, não compartilhe este link com ninguém.</p>
    </div>
  `;

  return {
    to: data.email,
    toName: data.nome,
    subject: "🔐 Recuperação de Senha - Sistema de Reservas",
    html: wrapTemplate(content, "Recuperação de Senha"),
    text: `Olá ${data.nome}, você solicitou a recuperação de senha. Acesse o link para redefinir: ${resetUrl}. Este link é válido por 1 hora.`,
  };
}

// Template: Boas-vindas
export function templateBoasVindas(data: BoasVindasEmailData): EmailData {
  const roleLabels: Record<string, string> = {
    morador: "Morador",
    sindico: "Síndico",
    administradora: "Administradora",
    super_admin: "Super Administrador",
  };

  const content = `
    <div class="header">
      <h1>🎉 Bem-vindo(a)!</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.nome}!</p>
      <p>Sua conta foi criada com sucesso no Sistema de Reservas.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${data.nome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Perfil:</span>
          <span class="info-value">${roleLabels[data.role] || data.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Condomínio:</span>
          <span class="info-value">${data.condominioNome}</span>
        </div>
      </div>
      
      <div class="success-box">
        <strong>Próximos passos:</strong> Agora você pode fazer login e começar a utilizar o sistema para reservar áreas comuns do condomínio.
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.email,
    toName: data.nome,
    subject: `🎉 Bem-vindo(a) ao Sistema de Reservas - ${data.condominioNome}`,
    html: wrapTemplate(content, "Bem-vindo"),
    text: `Olá ${data.nome}, bem-vindo(a) ao Sistema de Reservas do ${data.condominioNome}! Sua conta foi criada com sucesso.`,
  };
}

// Template: Cadastro Aprovado
export function templateCadastroAprovado(data: BoasVindasEmailData): EmailData {
  const content = `
    <div class="header">
      <h1>✅ Cadastro Aprovado</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.nome}!</p>
      <p>Seu cadastro foi <strong>aprovado</strong> pelo síndico do condomínio.</p>
      
      <div class="success-box">
        <strong>Parabéns!</strong> Agora você pode acessar o sistema e fazer reservas das áreas comuns.
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Condomínio:</span>
          <span class="info-value">${data.condominioNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.email}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.email,
    toName: data.nome,
    subject: `✅ Cadastro Aprovado - ${data.condominioNome}`,
    html: wrapTemplate(content, "Cadastro Aprovado"),
    text: `Olá ${data.nome}, seu cadastro foi aprovado! Agora você pode acessar o Sistema de Reservas do ${data.condominioNome}.`,
  };
}

// Template: Notificação para Síndico
export function templateNotificacaoSindico(data: NotificacaoSindicoEmailData): EmailData {
  const isNovaReserva = data.tipo === "nova_reserva";
  const headerColor = isNovaReserva 
    ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
    : "linear-gradient(135deg, #ef4444 0%, #f87171 100%)";
  const emoji = isNovaReserva ? "📅" : "❌";
  const titulo = isNovaReserva ? "Nova Reserva (Área Paga)" : "Cancelamento de Reserva";

  const content = `
    <div class="header" style="background: ${headerColor};">
      <h1>${emoji} ${titulo}</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.sindicoNome}!</p>
      <p>${isNovaReserva 
        ? "Uma nova reserva foi realizada em uma área com cobrança:"
        : "Uma reserva foi cancelada:"
      }</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Protocolo:</span>
          <span class="info-value">${data.protocolo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Morador:</span>
          <span class="info-value">${data.moradorNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valor:</span>
          <span class="info-value"><strong>R$ ${data.valor.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.sindicoEmail,
    toName: data.sindicoNome,
    subject: `${emoji} ${titulo} - ${data.areaNome} - R$ ${data.valor.toFixed(2)}`,
    html: wrapTemplate(content, titulo),
    text: `${titulo}: ${data.areaNome}, Morador: ${data.moradorNome}, Data: ${data.data}, Valor: R$ ${data.valor.toFixed(2)}`,
  };
}

// Template: Interesse em Cancelamento
export function templateInteresseCancelamento(data: ReservaEmailData & { interessadoNome: string; interessadoEmail: string }): EmailData {
  const content = `
    <div class="header">
      <h1>🔔 Vaga Disponível!</h1>
      <div class="subtitle">${data.condominioNome}</div>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${data.interessadoNome}!</p>
      <p>Uma reserva que você tinha interesse foi <strong>cancelada</strong> e a vaga está disponível!</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Área:</span>
          <span class="info-value">${data.areaNome}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${data.data}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Horário:</span>
          <span class="info-value">${data.horarioInicio} às ${data.horarioFim}</span>
        </div>
      </div>
      
      <div class="warning-box">
        <strong>Atenção:</strong> Corra para fazer sua reserva! Quem reservar primeiro, leva.
      </div>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema de Reservas</p>
      <p>${data.condominioNome}</p>
    </div>
  `;

  return {
    to: data.interessadoEmail,
    toName: data.interessadoNome,
    subject: `🔔 Vaga Disponível - ${data.areaNome} - ${data.data}`,
    html: wrapTemplate(content, "Vaga Disponível"),
    text: `Olá ${data.interessadoNome}, uma vaga ficou disponível! Área: ${data.areaNome}, Data: ${data.data}. Quem reservar primeiro, leva!`,
  };
}

// ============================================
// SERVIÇO DE ENVIO DE EMAIL
// ============================================

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Usar a API de notificação do Manus para enviar emails
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      console.warn("[Email] Forge API não configurada, email não enviado");
      return false;
    }

    const endpoint = `${ENV.forgeApiUrl}/webdevtoken.v1.WebDevService/SendEmail`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        to: emailData.to,
        toName: emailData.toName || "",
        subject: emailData.subject,
        htmlBody: emailData.html,
        textBody: emailData.text || "",
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Email] Falha ao enviar email (${response.status}): ${detail}`);
      return false;
    }

    console.log(`[Email] Email enviado com sucesso para ${emailData.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

// Função auxiliar para enviar múltiplos emails
export async function sendBulkEmails(emails: EmailData[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const success = await sendEmail(email);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
