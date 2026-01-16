import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  UserCheck, CalendarCheck, Loader2, CheckCircle, XCircle, User, Clock, 
  CalendarDays, Home, Mail, Phone, Sparkles, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Aprovacoes() {
  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];

  const { data: moradoresPendentes = [], refetch: refetchMoradores } = trpc.moradores.listPendentes.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const { data: reservasPendentes = [], refetch: refetchReservas } = trpc.reservas.listPendentes.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const aprovarMoradorMutation = trpc.moradores.aprovar.useMutation({
    onSuccess: () => {
      toast.success("Morador aprovado com sucesso!");
      refetchMoradores();
    }
  });

  const rejeitarMoradorMutation = trpc.moradores.rejeitar.useMutation({
    onSuccess: () => {
      toast.success("Cadastro rejeitado");
      refetchMoradores();
    }
  });

  const confirmarReservaMutation = trpc.reservas.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Reserva confirmada com sucesso!");
      refetchReservas();
    }
  });

  const cancelarReservaMutation = trpc.reservas.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada");
      refetchReservas();
    }
  });

  const totalPendentes = moradoresPendentes.length + reservasPendentes.length;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-orange-500/5 p-8 border border-amber-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Pendências</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
              <p className="text-muted-foreground">
                {totalPendentes} item(ns) aguardando aprovação
              </p>
            </div>
            
            {totalPendentes > 0 && (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-500/25">
                {totalPendentes}
              </div>
            )}
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="moradores" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="moradores" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 gap-2">
              <UserCheck className="h-4 w-4" />
              Moradores
              {moradoresPendentes.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-medium">
                  {moradoresPendentes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reservas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 gap-2">
              <CalendarCheck className="h-4 w-4" />
              Reservas
              {reservasPendentes.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-medium">
                  {reservasPendentes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Moradores Tab */}
          <TabsContent value="moradores">
            {moradoresPendentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <UserCheck className="h-10 w-10" />
                </div>
                <h3>Nenhum cadastro pendente</h3>
                <p>Todos os cadastros de moradores foram processados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {moradoresPendentes.map((morador) => (
                  <Card key={morador.id} className="premium-card-interactive group">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <User className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{morador.nome}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {morador.email}
                            </span>
                            {morador.telefone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {morador.telefone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-xs font-medium">
                              <Home className="h-3 w-3" />
                              Unidade {morador.unidadeId}
                            </span>
                            <span className="badge-info">{morador.tipo}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="rounded-xl h-11 px-5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => rejeitarMoradorMutation.mutate({ id: morador.id })}
                            disabled={rejeitarMoradorMutation.isPending}
                          >
                            {rejeitarMoradorMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </>
                            )}
                          </Button>
                          <Button
                            className="btn-premium"
                            onClick={() => aprovarMoradorMutation.mutate({ id: morador.id })}
                            disabled={aprovarMoradorMutation.isPending}
                          >
                            {aprovarMoradorMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reservas Tab */}
          <TabsContent value="reservas">
            {reservasPendentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CalendarCheck className="h-10 w-10" />
                </div>
                <h3>Nenhuma reserva pendente</h3>
                <p>Todas as reservas foram processadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservasPendentes.map((reserva) => (
                  <Card key={reserva.id} className="premium-card-interactive group">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Clock className="h-7 w-7 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg font-mono">#{reserva.protocolo}</h3>
                            <span className="badge-warning">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
                              <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                              {format(new Date(reserva.dataReserva), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50">
                              <Clock className="h-3.5 w-3.5 text-violet-500" />
                              {reserva.horaInicio} - {reserva.horaFim}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Área #{reserva.areaId} • Morador #{reserva.moradorId}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="rounded-xl h-11 px-5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => cancelarReservaMutation.mutate({ id: reserva.id })}
                            disabled={cancelarReservaMutation.isPending}
                          >
                            {cancelarReservaMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </>
                            )}
                          </Button>
                          <Button
                            className="btn-premium"
                            onClick={() => confirmarReservaMutation.mutate({ id: reserva.id })}
                            disabled={confirmarReservaMutation.isPending}
                          >
                            {confirmarReservaMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
