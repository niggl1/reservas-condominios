import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  CalendarDays, Plus, Search, ChevronLeft, ChevronRight, Clock, User, Home, 
  MoreVertical, CheckCircle, XCircle, Eye, MapPin, ArrowUpRight, Sparkles
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reservas() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];
  
  const { data: reservas = [], refetch } = trpc.reservas.list.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const confirmarMutation = trpc.reservas.confirmar.useMutation({
    onSuccess: () => {
      toast.success("Reserva confirmada com sucesso!");
      refetch();
    }
  });

  const cancelarMutation = trpc.reservas.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada");
      refetch();
    }
  });

  // Filter reservas for selected date
  const reservasDodia = selectedDate 
    ? reservas.filter(r => isSameDay(new Date(r.dataReserva), selectedDate))
    : reservas;

  // Search filter
  const filteredReservas = reservasDodia.filter(r => 
    r.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
    r.moradorId?.toString().includes(search)
  );

  // Get reservas count per day for calendar
  const getReservasForDay = (date: Date) => {
    return reservas.filter(r => isSameDay(new Date(r.dataReserva), date));
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmada': return <span className="badge-success"><CheckCircle className="h-3 w-3" />Confirmada</span>;
      case 'pendente': return <span className="badge-warning"><Clock className="h-3 w-3" />Pendente</span>;
      case 'cancelada': return <span className="badge-destructive"><XCircle className="h-3 w-3" />Cancelada</span>;
      case 'utilizada': return <span className="badge-info"><CheckCircle className="h-3 w-3" />Utilizada</span>;
      default: return <span className="badge-info">{status}</span>;
    }
  };

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5 p-8 border border-emerald-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">Gestão de Reservas</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Calendário de Reservas</h1>
              <p className="text-muted-foreground">
                {selectedCondominio?.nome || "Selecione um condomínio"} • {reservas.length} reserva(s)
              </p>
            </div>
            
            <Button onClick={() => setLocation('/reservas/nova')} className="btn-premium self-start md:self-center">
              <Plus className="h-5 w-5" />
              Nova Reserva
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Premium Calendar */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Calendário</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-emerald-500/10"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-emerald-500/10"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground capitalize font-medium">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-3">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-11" />
                ))}
                {/* Days of month */}
                {daysInMonth.map((day) => {
                  const dayReservas = getReservasForDay(day);
                  const hasConfirmada = dayReservas.some(r => r.status === 'confirmada');
                  const hasPendente = dayReservas.some(r => r.status === 'pendente');
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(isSelected ? undefined : day)}
                      className={`
                        h-11 rounded-xl text-sm relative transition-all duration-200 font-medium
                        ${isSelected ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 scale-105' : ''}
                        ${isToday && !isSelected ? 'bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-500/30' : ''}
                        ${!isSelected && !isToday ? 'hover:bg-muted' : ''}
                      `}
                    >
                      {format(day, 'd')}
                      {dayReservas.length > 0 && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {hasConfirmada && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {hasPendente && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex gap-6 mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-green-500" />
                  <span className="text-muted-foreground">Confirmada</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500" />
                  <span className="text-muted-foreground">Pendente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Reservas List */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {selectedDate 
                      ? `Reservas de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                      : "Todas as Reservas"
                    }
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {filteredReservas.length} reserva(s) encontrada(s)
                  </CardDescription>
                </div>
                {selectedDate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedDate(undefined)}
                    className="rounded-xl"
                  >
                    Ver todas
                  </Button>
                )}
              </div>
              
              {/* Premium Search */}
              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-border/50 bg-background/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredReservas.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <CalendarDays className="h-10 w-10" />
                  </div>
                  <h3>Nenhuma reserva encontrada</h3>
                  <p>
                    {search ? "Tente uma busca diferente" : selectedDate ? "Não há reservas para esta data" : "Não há reservas cadastradas"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReservas.map((reserva) => (
                    <div 
                      key={reserva.id} 
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 cursor-pointer"
                      onClick={() => setLocation(`/reservas/${reserva.id}`)}
                    >
                      <div className={`w-1.5 h-14 rounded-full bg-gradient-to-b ${getStatusColor(reserva.status)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg">#{reserva.protocolo}</span>
                          {getStatusBadge(reserva.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {reserva.horaInicio} - {reserva.horaFim}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(reserva.dataReserva), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setLocation(`/reservas/${reserva.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {reserva.status === 'pendente' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmarMutation.mutate({ id: reserva.id })}
                                  className="text-emerald-600 focus:text-emerald-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => cancelarMutation.mutate({ id: reserva.id })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                            {reserva.status === 'confirmada' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => cancelarMutation.mutate({ id: reserva.id })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
