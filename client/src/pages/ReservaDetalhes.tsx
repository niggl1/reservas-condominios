import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, CalendarDays, Clock, User, Home, History, CheckCircle, XCircle, DollarSign, FileText, ExternalLink } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReservaDetalhes() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  
  const { data: reserva, isLoading, refetch } = trpc.reservas.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !!params.id }
  );

  const { data: timeline = [] } = trpc.timeline.list.useQuery(
    { reservaId: parseInt(params.id || "0") },
    { enabled: !!params.id }
  );

  const { data: area } = trpc.areasComuns.getById.useQuery(
    { id: reserva?.areaId ?? 0 },
    { enabled: !!reserva?.areaId }
  );

  const confirmarMutation = trpc.reservas.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Reserva confirmada");
      refetch();
    }
  });

  const cancelarMutation = trpc.reservas.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada");
      refetch();
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmada': return <span className="badge-success text-base px-3 py-1">Confirmada</span>;
      case 'pendente': return <span className="badge-warning text-base px-3 py-1">Pendente</span>;
      case 'cancelada': return <span className="badge-destructive text-base px-3 py-1">Cancelada</span>;
      case 'utilizada': return <span className="badge-info text-base px-3 py-1">Utilizada</span>;
      default: return <span className="badge-info text-base px-3 py-1">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!reserva) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Reserva não encontrada</h2>
          <Button onClick={() => setLocation('/reservas')}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/reservas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Reserva #{reserva.protocolo}</h1>
              {getStatusBadge(reserva.status)}
            </div>
            <p className="text-muted-foreground">
              Criada em {format(new Date(reserva.createdAt), "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
          {reserva.status === 'pendente' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => cancelarMutation.mutate({ id: reserva.id })}
                disabled={cancelarMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button 
                onClick={() => confirmarMutation.mutate({ id: reserva.id })}
                disabled={confirmarMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Info Card */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-base">Informações da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {area?.icone || "🏢"}
                </div>
                <div>
                  <h3 className="font-medium">{area?.nome || `Área #${reserva.areaId}`}</h3>
                  {area?.descricao && (
                    <p className="text-sm text-muted-foreground">{area.descricao}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(reserva.dataReserva), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{reserva.horaInicio} - {reserva.horaFim}</p>
                  </div>
                </div>
              </div>

              {reserva.quantidadePessoas && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade de Pessoas</p>
                    <p className="font-medium">{reserva.quantidadePessoas}</p>
                  </div>
                </div>
              )}

              {area?.valor && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium">R$ {area.valor}</p>
                  </div>
                </div>
              )}

              {area?.linkPagamento && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={area.linkPagamento} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Link de Pagamento
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Morador Card */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-base">Dados do Morador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Morador</p>
                  <p className="font-medium">ID #{reserva.moradorId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Unidade</p>
                  <p className="font-medium">#{reserva.unidadeId}</p>
                </div>
              </div>

              {reserva.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm p-2 rounded bg-muted/50">{reserva.observacoes}</p>
                </div>
              )}

              {reserva.termoAceito && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Termo de uso aceito
                </div>
              )}

              {reserva.assinaturaDigital && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assinatura Digital</p>
                  <p className="font-medium italic">{reserva.assinaturaDigital}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma ação registrada</p>
              ) : (
                timeline.map((item: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{item.acao}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                        {item.usuarioId && ` • Usuário #${item.usuarioId}`}
                      </p>
                      {item.observacao && (
                        <p className="text-sm text-muted-foreground mt-1">{item.observacao}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
