import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, Users, Building2, Clock, Plus, CheckCircle, AlertCircle, 
  MapPin, FileBarChart, Settings, TrendingUp, Sparkles, ArrowUpRight
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  
  const firstCondominio = condominios[0];
  const { data: stats } = trpc.condominios.getEstatisticas.useQuery(
    { condominioId: firstCondominio?.id ?? 0 },
    { enabled: !!firstCondominio }
  );

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Administrador",
      administradora: "Administradora",
      sindico: "Síndico",
      morador: "Morador"
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      super_admin: "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      administradora: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      sindico: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      morador: "bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    };
    return classes[role] || classes.morador;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-8 border border-primary/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Bem-vindo de volta</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Olá, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Usuário'}</span>!
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user?.role || 'morador')}`}>
                  {getRoleLabel(user?.role || 'morador')}
                </span>
                {condominios.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {condominios[0]?.nome}
                  </span>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => setLocation('/reservas/nova')} 
              className="btn-premium self-start md:self-center"
            >
              <Plus className="h-5 w-5" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {/* Premium Stats Cards */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Moradores</p>
                  <p className="text-4xl font-bold tracking-tight">{stats.totalMoradores}</p>
                  <p className="text-xs text-muted-foreground">Cadastrados e aprovados</p>
                </div>
                <div className="stat-card-icon group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Áreas Comuns</p>
                  <p className="text-4xl font-bold tracking-tight">{stats.totalAreas}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis para reserva</p>
                </div>
                <div className="stat-card-icon group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Reservas do Mês</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold tracking-tight">{stats.reservasMes}</p>
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +12%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Realizadas este mês</p>
                </div>
                <div className="stat-card-icon group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-4xl font-bold tracking-tight">{stats.reservasPendentes}</p>
                  <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-yellow-500/10 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
            Acesso Rápido
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Morador Actions */}
            {user?.role === 'morador' && (
              <>
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/reservas/nova')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Nova Reserva</CardTitle>
                          <CardDescription className="text-sm">Agende um espaço</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/minhas-reservas')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Minhas Reservas</CardTitle>
                          <CardDescription className="text-sm">Ver histórico</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
              </>
            )}

            {/* Sindico/Admin Actions */}
            {(user?.role === 'sindico' || user?.role === 'administradora' || user?.role === 'super_admin') && (
              <>
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/aprovacoes')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <AlertCircle className="h-6 w-6 text-amber-600" />
                          {stats && stats.reservasPendentes > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {stats.reservasPendentes}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Aprovações</CardTitle>
                          <CardDescription className="text-sm">Reservas e cadastros pendentes</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/moradores')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Moradores</CardTitle>
                          <CardDescription className="text-sm">Gerenciar cadastros</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/areas')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <MapPin className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Áreas Comuns</CardTitle>
                          <CardDescription className="text-sm">Configurar espaços</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/reservas')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Todas Reservas</CardTitle>
                          <CardDescription className="text-sm">Visualizar calendário</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
              </>
            )}

            {/* Super Admin Actions */}
            {user?.role === 'super_admin' && (
              <>
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/condominios')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Condomínios</CardTitle>
                          <CardDescription className="text-sm">Gerenciar todos</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/usuarios')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Usuários</CardTitle>
                          <CardDescription className="text-sm">Gerenciar permissões</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
                
                <Card 
                  className="premium-card-interactive group" 
                  onClick={() => setLocation('/relatorios')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <FileBarChart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">Relatórios</CardTitle>
                          <CardDescription className="text-sm">Estatísticas e exportação</CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* No Condominio Warning */}
        {condominios.length === 0 && user?.role !== 'super_admin' && (
          <Card className="border-amber-200 dark:border-amber-900 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">Nenhum condomínio vinculado</CardTitle>
                  <CardDescription className="text-sm">
                    Você ainda não está vinculado a nenhum condomínio. 
                    Entre em contato com o síndico ou administradora para solicitar acesso.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
