# Sistema de Reservas para Condomínios - TODO

## Modelo de Dados e Backend
- [x] Schema de usuários com hierarquia (super_admin, administradora, sindico, morador)
- [x] Schema de condomínios
- [x] Schema de blocos/unidades
- [x] Schema de moradores com vínculo a unidades
- [x] Schema de áreas comuns com configurações completas
- [x] Schema de faixas de horário por área
- [x] Schema de reservas com protocolo de 6 dígitos
- [x] Schema de timeline de ações (histórico)
- [x] Schema de bloqueios (por dia da semana e datas específicas)
- [x] Schema de áreas compartilhadas/vinculadas
- [x] Schema de limites globais e por área
- [x] Schema de termos de aceite e assinaturas digitais
- [x] Schema de notificações de interesse em cancelamento
- [x] Schema de bloqueio de moradores
- [x] Migração do banco de dados

## APIs do Backend (tRPC)
- [x] CRUD de condomínios
- [x] CRUD de blocos e unidades
- [x] CRUD de moradores (manual, link, QR, Excel)
- [x] CRUD de áreas comuns
- [x] CRUD de faixas de horário
- [x] CRUD de reservas com validações
- [x] API de aprovação/rejeição de cadastros
- [x] API de aprovação/cancelamento de reservas
- [x] API de bloqueios
- [x] API de áreas compartilhadas
- [x] API de limites e validações
- [x] API de busca (protocolo, nome, bloco, apartamento, email, telefone)
- [x] API de notificações
- [x] API de termos e assinaturas digitais
- [x] API de interesse em cancelamento
- [x] API de timeline de ações

## Interfaces do Frontend
- [x] Página de login com autenticação
- [x] Dashboard principal com estatísticas
- [x] Gestão de condomínios (CRUD)
- [x] Gestão de moradores (CRUD + aprovação)
- [x] Gestão de áreas comuns com todas as configurações
- [x] Calendário de reservas (verde=confirmada, amarelo=pendente)
- [x] Formulário de nova reserva com validações
- [x] Detalhes da reserva com timeline
- [x] Minhas Reservas (para moradores)
- [x] Tela de aprovações pendentes
- [x] Configurações globais do condomínio
- [x] Página de auto-cadastro público (link/QR)
- [x] Gestão de usuários e permissões

## Autenticação e Hierarquia
- [x] Login via Manus OAuth
- [x] Hierarquia Super Admin (acesso total)
- [x] Hierarquia Administradora (seus condomínios)
- [x] Hierarquia Síndico (seu condomínio)
- [x] Hierarquia Morador (suas reservas)

## Configurações por Área (Implementadas)
- [x] Limites por horário/dia/semana/mês/ano
- [x] Limites por unidade e por morador
- [x] Dias mínimos/máximos de antecedência
- [x] Dias mínimos para cancelamento
- [x] Valor/preço da reserva
- [x] Quantidade máxima de pessoas
- [x] Confirmação automática ou manual
- [x] Múltiplas reservas simultâneas
- [x] Bloqueio após reserva até utilização
- [x] Áreas compartilhadas/vinculadas
- [x] Bloqueios por dia da semana
- [x] Bloqueios por datas específicas

## Design e UX
- [x] Design premium com cores modernas
- [x] Interface intuitiva com poucos cliques
- [x] Responsivo (web, tablet, mobile)
- [x] Dashboard com cards de acesso rápido
- [x] Ícones cartoon 3D para áreas
- [x] Galeria de fotos por área
- [ ] Modo escuro
- [x] Relatórios exportáveis (PDF/Excel)

## Funcionalidades Extras (Futuras)
- [ ] QR Code de check-in
- [ ] Avaliação pós-uso
- [x] Notificações push (lembretes)
- [x] Importação de moradores via Excel


## Galeria de Fotos para Áreas Comuns
- [x] Componente de upload de múltiplas fotos (PhotoUploader)
- [x] Compressão de imagens antes do upload (limite 100MB)
- [x] Armazenamento de fotos em base64 no banco
- [x] Componente de galeria/carrossel sem autoplay (PhotoGallery)
- [x] Visualização de fotos na página de nova reserva
- [x] Visualização de fotos na listagem de áreas comuns
- [x] Tab de Fotos no formulário de área comum
- [x] Testes unitários da galeria (10 testes)

## Relatórios Exportáveis (PDF/Excel)
- [x] API de estatísticas de reservas por período
- [x] API de estatísticas de ocupação por área
- [x] API de receitas por área e período
- [x] Geração de PDF com estatísticas e gráficos (via impressão)
- [x] Exportação para Excel com dados detalhados (xlsx)
- [x] Página de relatórios com filtros (período, área, condomínio)
- [x] Gráficos de ocupação e receitas (barras)
- [x] Download de relatórios em PDF e Excel
- [x] Testes unitários dos relatórios (10 testes)

## Design Premium para Todos os Perfis
- [x] Tema global com gradientes e sombras premium
- [x] Cards com efeitos hover e animações suaves
- [x] Dashboard com visual moderno e estatísticas destacadas
- [x] Tabelas com design elegante e alternância de cores
- [x] Formulários com inputs estilizados e validação visual
- [x] Botões com gradientes e efeitos de clique
- [x] Sidebar com ícones coloridos e indicadores visuais
- [x] Página de reservas com calendário premium
- [x] Página de áreas comuns com cards visuais
- [x] Página de moradores com avatares e badges
- [x] Página de configurações com seções organizadas
- [x] Página de relatórios com gráficos estilizados
- [x] Landing page com hero section premium
- [x] Responsividade aprimorada para mobile

## Importação de Moradores via Excel
- [x] Instalar dependência xlsx para processamento de Excel
- [x] API de upload e parsing de arquivo Excel
- [x] Validação de campos obrigatórios (nome, email, bloco, unidade)
- [x] Validação de formato de email
- [x] Validação de duplicatas (email já cadastrado)
- [x] Validação de bloco/unidade existente
- [x] Preview dos dados antes da importação
- [x] Feedback detalhado de erros por linha
- [x] Importação em lote com transação
- [x] Download de modelo de planilha Excel
- [x] Interface de upload com drag and drop
- [x] Barra de progresso da importação
- [x] Relatório final de importação (sucesso/erros)
- [x] Testes unitários da importação (11 testes)

## Sistema de Autenticação Própria (Email/Senha)
- [x] Schema de usuários com senha hash (bcrypt)
- [x] API de registro de usuário
- [x] API de login com email/senha
- [x] API de recuperação de senha
- [x] API de redefinição de senha
- [x] Geração de token JWT próprio
- [x] Página de login independente
- [x] Página de registro para novos usuários
- [x] Página de recuperação de senha
- [x] Página de redefinição de senha
- [x] Visualização de senha (ícone olho)
- [x] Validação de força de senha
- [x] Token de recuperação de senha
- [x] Integração com hierarquia de perfis existente
- [x] Login independente do OAuth Manus
- [x] Testes unitários da autenticação (17 testes)

## Sistema de Notificações por Email
- [x] Serviço de envio de email (usando API de notificação Manus)
- [x] Template de confirmação de reserva
- [x] Template de cancelamento de reserva
- [x] Template de lembrete de reserva
- [x] Template de recuperação de senha
- [x] Template de boas-vindas ao novo usuário
- [x] Template de aprovação de cadastro
- [x] Template de notificação para síndico (áreas pagas)
- [x] Template de interesse em cancelamento
- [x] Integração com API de reservas (criar, confirmar, cancelar)
- [x] Integração com API de autenticação (recuperação de senha)
- [x] Configuração de notificações por área
- [x] Testes unitários das notificações (16 testes)

## PWA (Progressive Web App) com Notificações Push
- [x] Manifest.json com configurações do app
- [x] Ícones do app em múltiplos tamanhos (72x72 até 512x512)
- [x] Service Worker para cache e funcionamento offline
- [x] Configuração de instalação do app (Add to Home Screen)
- [x] Sistema de notificações push (Web Push API)
- [x] Permissão e gerenciamento de notificações no frontend
- [x] API para envio de notificações push
- [x] Notificações de nova reserva
- [x] Notificações de confirmação de reserva
- [x] Notificações de cancelamento
- [x] Notificações de lembrete (24h antes)
- [x] Armazenamento de tokens de push no banco
- [x] Interface de configurações de notificações do usuário
- [x] Botão de instalação do app na interface
- [x] Splash screen e tema do app
- [x] Testes do PWA e notificações (18 testes)

## Controle de Chaves/Acessos
- [x] Schema de chaves (id, área, identificação, quantidade)
- [x] Schema de movimentação de chaves (retirada/devolução)
- [x] API de cadastro de chaves por área
- [x] API de registro de retirada de chave
- [x] API de registro de devolução de chave
- [x] API de histórico de movimentação
- [x] API de chaves pendentes de devolução
- [x] API de relatório de chaves
- [x] Página de gestão de chaves
- [x] Modal de retirada de chave
- [x] Modal de devolução de chave
- [x] Histórico de movimentação por chave
- [x] Alerta de chaves não devolvidas (tab Pendentes)
- [x] Integração com reservas (vincular chave à reserva)
- [x] Relatório de chaves em posse de moradores
- [x] Testes unitários do controle de chaves (29 testes)


## Personalização de Ícones PWA
- [ ] Gerar novos ícones PWA com design moderno
- [ ] Criar pasta para tema de ícones "clássico" (atual)
- [ ] Criar pasta para tema de ícones "moderno" (novo)
- [ ] Implementar seleção de tema de ícones nas configurações
- [ ] Atualizar manifest.json dinamicamente baseado na escolha
