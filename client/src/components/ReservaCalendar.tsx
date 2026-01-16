import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reserva {
  id: number;
  dataReserva: Date | string;
  horaInicio: string;
  horaFim: string;
  status: string;
  areaNome?: string;
  moradorNome?: string;
  unidade?: string;
}

interface ReservaCalendarProps {
  reservas: Reserva[];
  onDateSelect?: (date: Date) => void;
  onReservaClick?: (reserva: Reserva) => void;
  selectedDate?: Date;
}

export function ReservaCalendar({ 
  reservas, 
  onDateSelect, 
  onReservaClick,
  selectedDate 
}: ReservaCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());

  // Agrupa reservas por data
  const reservasByDate = reservas.reduce((acc, reserva) => {
    const dateKey = format(new Date(reserva.dataReserva), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(reserva);
    return acc;
  }, {} as Record<string, Reserva[]>);

  // Função para obter o status predominante de um dia
  const getDayStatus = (day: Date): "confirmada" | "pendente" | "none" => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayReservas = reservasByDate[dateKey];
    
    if (!dayReservas || dayReservas.length === 0) return "none";
    
    const hasConfirmada = dayReservas.some(r => r.status === "confirmada");
    const hasPendente = dayReservas.some(r => r.status === "pendente");
    
    if (hasConfirmada && hasPendente) return "pendente"; // Mostrar amarelo se há pendentes
    if (hasConfirmada) return "confirmada";
    if (hasPendente) return "pendente";
    return "none";
  };

  // Reservas do dia selecionado
  const selectedDateReservas = date 
    ? reservasByDate[format(date, "yyyy-MM-dd")] || []
    : [];

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate && onDateSelect) {
      onDateSelect(newDate);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Calendário de Reservas
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Pendente</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            locale={ptBR}
            className="rounded-md border"
            modifiers={{
              confirmada: (day) => getDayStatus(day) === "confirmada",
              pendente: (day) => getDayStatus(day) === "pendente",
            }}
            modifiersStyles={{
              confirmada: {
                backgroundColor: "rgb(34 197 94 / 0.2)",
                borderRadius: "50%",
                position: "relative",
              },
              pendente: {
                backgroundColor: "rgb(234 179 8 / 0.2)",
                borderRadius: "50%",
                position: "relative",
              },
            }}
            
          />
        </CardContent>
      </Card>

      {/* Lista de reservas do dia */}
      <Card>
        <CardHeader>
          <CardTitle>
            {date ? (
              <>Reservas de {format(date, "dd 'de' MMMM", { locale: ptBR })}</>
            ) : (
              <>Selecione uma data</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateReservas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma reserva para esta data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateReservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onReservaClick?.(reserva)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{reserva.areaNome || "Área"}</p>
                      <p className="text-sm text-muted-foreground">
                        {reserva.horaInicio} - {reserva.horaFim}
                      </p>
                      {reserva.moradorNome && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {reserva.moradorNome}
                          {reserva.unidade && ` • ${reserva.unidade}`}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={reserva.status === "confirmada" ? "default" : "secondary"}
                      className={
                        reserva.status === "confirmada" 
                          ? "bg-green-500 hover:bg-green-600" 
                          : reserva.status === "pendente"
                          ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                          : ""
                      }
                    >
                      {reserva.status === "confirmada" ? "Confirmada" : 
                       reserva.status === "pendente" ? "Pendente" : 
                       reserva.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReservaCalendar;
