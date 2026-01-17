import DashboardLayout from "@/components/DashboardLayout";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { QrCode, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Checkin() {
  const { data: reservasHoje = [] } = trpc.reservas.listHoje.useQuery(undefined, {
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const reservasConfirmadas = reservasHoje.filter(r => r.status === 'confirmada');
  const reservasUtilizadas = reservasHoje.filter(r => r.status === 'utilizada');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Check-in de Reservas
          </h1>
          <p className="text-muted-foreground">
            Escaneie o QR Code ou digite o protocolo para realizar o check-in
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Scanner */}
          <QRCodeScanner />

          {/* Resumo do Dia */}
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="premium-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reservasConfirmadas.length}</p>
                      <p className="text-sm text-muted-foreground">Aguardando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reservasUtilizadas.length}</p>
                      <p className="text-sm text-muted-foreground">Check-ins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Reservas do Dia */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-base">Reservas de Hoje</CardTitle>
                <CardDescription>
                  {format(new Date(), "dd/MM/yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reservasHoje.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reserva para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {reservasHoje.map((reserva: any) => (
                      <div 
                        key={reserva.id}
                        className={`p-3 rounded-lg border ${
                          reserva.status === 'utilizada' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{reserva.area?.nome || 'Área'}</p>
                            <p className="text-sm text-muted-foreground">
                              {reserva.horaInicio} - {reserva.horaFim}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-bold">{reserva.protocolo}</p>
                            {reserva.status === 'utilizada' ? (
                              <span className="badge-success text-xs">Check-in ✓</span>
                            ) : (
                              <span className="badge-warning text-xs">Aguardando</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reserva.morador?.nome || 'Morador'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
