import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  CalendarDays, Plus, Clock, Eye, XCircle, Loader2, FileText, History,
  CheckCircle, ArrowUpRight, Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const areaIcons: Record<string, string> = {
  piscina: "🏊",
  churrasqueira: "🍖",
  salao: "🎉",
  academia: "🏋️",
  quadra: "🎾",
  default: "🏢"
};

export default function MinhasReservas() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; reservaId: number | null }>({ open: false, reservaId: null });
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; reserva: any | null }>({ open: false, reserva: null });

  const { data: morador } = trpc.moradores.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );

  const { data: reservas = [], refetch, isLoading } = trpc.reservas.listByMorador.useQuery(
    { moradorId: morador?.id ?? 0 },
    { enabled: !!morador }
  );

  const { data: timeline = [] } = trpc.timeline.list.useQuery(
    { reservaId: detailsDialog.reserva?.id ?? 0 },
    { enabled: !!detailsDialog.reserva }
  );

  const cancelarMutation = trpc.reservas.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada com sucesso");
      refetch();
      setCancelDialog({ open: false, reservaId: null });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar reserva");
    }
  });

  const getIcon = (nome: string) => {
    const key = Object.keys(areaIcons).find(k => nome?.toLowerCase().includes(k));
    return areaIcons[key || 'default'];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmada': return <span className="badge-success"><CheckCircle className="h-3 w-3" />Confirmada</span>;
      case 'pendente': return <span className="badge-warning"><Clock className="h-3 w-3" />Pendente</span>;
      case 'cancelada': return <span className="badge-destructive"><XCircle className="h-3 w-3" />Cancelada</span>;
      case 'utilizada': return <span className="badge-info"><CheckCircle className="h-3 w-3" />Utilizada</span>;
      default: return <span className="badge-info">{status}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'from-emerald-500 to-green-500';
      case 'pendente': return 'from-amber-500 to-yellow-500';
      case 'cancelada': return 'from-red-500 to-rose-500';
      case 'utilizada': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const reservasAtivas = reservas.filter(r => r.status === 'confirmada' || r.status === 'pendente');
  const reservasPassadas = reservas.filter(r => r.status === 'utilizada' || r.status === 'cancelada');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 p-8 border border-indigo-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">Suas Reservas</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Minhas Reservas</h1>
              <p className="text-muted-foreground">
                Gerencie suas reservas de áreas comuns • {reservas.length} reserva(s)
              </p>
            </div>
            
            <Button onClick={() => setLocation('/reservas/nova')} className="btn-premium self-start md:self-center">
              <Plus className="h-5 w-5" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="ativas" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="ativas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
              Ativas ({reservasAtivas.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
              <History className="h-4 w-4 mr-2 text-muted-foreground" />
              Histórico ({reservasPassadas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas">
            {reservasAtivas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CalendarDays className="h-10 w-10" />
                </div>
                <h3>Nenhuma reserva ativa</h3>
                <p>Você não possui reservas pendentes ou confirmadas</p>
                <Button onClick={() => setLocation('/reservas/nova')} className="mt-4 btn-premium">
                  <Plus className="h-5 w-5" />
                  Fazer Reserva
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {reservasAtivas.map((reserva) => (
                  <Card key={reserva.id} className="premium-card-interactive group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            {getIcon(reserva.areaId?.toString() || '')}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold group-hover:text-indigo-600 transition-colors">
                              Área #{reserva.areaId}
                            </CardTitle>
                            <CardDescription className="mt-0.5">
                              Protocolo: <span className="font-mono font-medium">#{reserva.protocolo}</span>
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(reserva.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 text-sm text-muted-foreground mb-5 p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-4 w-4 text-indigo-500" />
                          <span className="capitalize">{format(new Date(reserva.dataReserva), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-violet-500" />
                          <span>{reserva.horaInicio} às {reserva.horaFim}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl h-11"
                          onClick={() => setDetailsDialog({ open: true, reserva })}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                        {(reserva.status === 'confirmada' || reserva.status === 'pendente') && (
                          <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => setCancelDialog({ open: true, reservaId: reserva.id })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico">
            {reservasPassadas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <History className="h-10 w-10" />
                </div>
                <h3>Nenhum histórico</h3>
                <p>Suas reservas anteriores aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservasPassadas.map((reserva) => (
                  <div 
                    key={reserva.id}
                    className="group flex items-center gap-4 p-5 rounded-2xl border border-border/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300 cursor-pointer"
                    onClick={() => setDetailsDialog({ open: true, reserva })}
                  >
                    <div className={`w-1.5 h-14 rounded-full bg-gradient-to-b ${getStatusColor(reserva.status)}`} />
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-xl">
                      {getIcon(reserva.areaId?.toString() || '')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-lg">#{reserva.protocolo}</span>
                        {getStatusBadge(reserva.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(reserva.dataReserva), "dd/MM/yyyy")} • {reserva.horaInicio} - {reserva.horaFim}
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Cancel Dialog */}
        <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, reservaId: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                Cancelar Reserva
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setCancelDialog({ open: false, reservaId: null })} className="rounded-xl">
                Voltar
              </Button>
              <Button 
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  if (cancelDialog.reservaId) {
                    cancelarMutation.mutate({ id: cancelDialog.reservaId });
                  }
                }}
                disabled={cancelarMutation.isPending}
              >
                {cancelarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ open, reserva: null })}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                Detalhes da Reserva
              </DialogTitle>
              <DialogDescription>
                Protocolo: <span className="font-mono font-medium">#{detailsDialog.reserva?.protocolo}</span>
              </DialogDescription>
            </DialogHeader>
            {detailsDialog.reserva && (
              <div className="space-y-6 py-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-2xl">
                      {getIcon(detailsDialog.reserva.areaId?.toString() || '')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Área #{detailsDialog.reserva.areaId}</h3>
                      {getStatusBadge(detailsDialog.reserva.status)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-xl bg-background/50">
                      <span className="text-muted-foreground text-xs">Data</span>
                      <p className="font-semibold mt-0.5">
                        {format(new Date(detailsDialog.reserva.dataReserva), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50">
                      <span className="text-muted-foreground text-xs">Horário</span>
                      <p className="font-semibold mt-0.5">
                        {detailsDialog.reserva.horaInicio} - {detailsDialog.reserva.horaFim}
                      </p>
                    </div>
                    {detailsDialog.reserva.quantidadePessoas && (
                      <div className="p-3 rounded-xl bg-background/50">
                        <span className="text-muted-foreground text-xs">Pessoas</span>
                        <p className="font-semibold mt-0.5">{detailsDialog.reserva.quantidadePessoas}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-600" />
                    Histórico de Ações
                  </h4>
                  <div className="space-y-4">
                    {timeline.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 text-sm">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{item.acao}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          {item.observacao && (
                            <p className="text-muted-foreground text-xs mt-1 italic">{item.observacao}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
