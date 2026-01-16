import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Loader2, Clock, Users, DollarSign, FileText, CheckCircle, ImageIcon } from "lucide-react";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const areaIcons: Record<string, string> = {
  piscina: "🏊",
  churrasqueira: "🍖",
  salao: "🎉",
  academia: "🏋️",
  quadra: "🎾",
  playground: "👶",
  jogos: "🎮",
  spa: "🧘",
  default: "🏢"
};

export default function NovaReserva() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedHorario, setSelectedHorario] = useState<{ inicio: string; fim: string } | null>(null);
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [termoAceito, setTermoAceito] = useState(false);
  const [assinatura, setAssinatura] = useState("");

  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];

  const { data: areas = [] } = trpc.areasComuns.list.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const { data: morador } = trpc.moradores.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );

  const { data: faixasHorario = [] } = trpc.faixasHorario.list.useQuery(
    { areaId: selectedArea ?? 0 },
    { enabled: !!selectedArea }
  );

  const { data: reservasExistentes = [] } = trpc.reservas.listByAreaAndDate.useQuery(
    { areaId: selectedArea ?? 0, data: selectedDate ? new Date(selectedDate) : new Date() },
    { enabled: !!selectedArea && !!selectedDate }
  );

  const createMutation = trpc.reservas.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Reserva criada com sucesso! Protocolo: ${data.protocolo}`);
      setLocation("/minhas-reservas");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar reserva");
    }
  });

  const areaData = areas.find(a => a.id === selectedArea);

  const getIcon = (nome: string, icone?: string | null) => {
    if (icone) return icone;
    const key = Object.keys(areaIcons).find(k => nome.toLowerCase().includes(k));
    return areaIcons[key || 'default'];
  };

  // Generate available dates based on area config
  const getAvailableDates = () => {
    if (!areaData) return [];
    const dates = [];
    const today = startOfDay(new Date());
    const minDate = addDays(today, areaData.diasMinimoAntecedencia || 0);
    const maxDate = addDays(today, areaData.diasMaximoAntecedencia || 30);
    
    let current = minDate;
    while (isBefore(current, maxDate) || current.getTime() === maxDate.getTime()) {
      dates.push(current);
      current = addDays(current, 1);
    }
    return dates;
  };

  // Check if horario is available
  const isHorarioAvailable = (inicio: string, fim: string) => {
    if (!areaData?.permitirMultiplasReservas) {
      return !reservasExistentes.some(r => 
        r.horaInicio === inicio && r.horaFim === fim && 
        (r.status === 'confirmada' || r.status === 'pendente')
      );
    }
    const count = reservasExistentes.filter(r => 
      r.horaInicio === inicio && r.horaFim === fim &&
      (r.status === 'confirmada' || r.status === 'pendente')
    ).length;
    return count < (areaData.limiteReservasPorHorario || 1);
  };

  const handleSubmit = () => {
    if (!selectedArea || !selectedDate || !selectedHorario || !morador) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (areaData?.termoAceite && !termoAceito) {
      toast.error("Você precisa aceitar o termo de uso");
      return;
    }

    createMutation.mutate({
      areaId: selectedArea,
      moradorId: morador.id,
      unidadeId: morador.unidadeId,
      condominioId: selectedCondominio?.id ?? 0,
      dataReserva: new Date(selectedDate),
      horaInicio: selectedHorario.inicio,
      horaFim: selectedHorario.fim,
      quantidadePessoas,
      observacoes,
      termoAceito,
      assinaturaDigital: assinatura,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/reservas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Reserva</h1>
            <p className="text-muted-foreground">
              Selecione a área e o horário desejado
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Area */}
        {step === 1 && (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Selecione a Área</CardTitle>
              <CardDescription>Escolha a área comum que deseja reservar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      setSelectedArea(area.id);
                      setStep(2);
                    }}
                    className={`
                      p-4 rounded-xl border text-left transition-all
                      ${selectedArea === area.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{getIcon(area.nome, area.icone)}</div>
                    <h3 className="font-medium">{area.nome}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {area.capacidadeMaxima && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {area.capacidadeMaxima}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {area.valor || 'Grátis'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && areaData && (
          <div className="space-y-6">
            {/* Galeria de Fotos da Área */}
            {areaData.fotos && (() => {
              try {
                const fotosArray = typeof areaData.fotos === 'string' ? JSON.parse(areaData.fotos) : areaData.fotos;
                if (Array.isArray(fotosArray) && fotosArray.length > 0) {
                  return (
                    <Card className="premium-card">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">Fotos do Espaço</CardTitle>
                            <CardDescription>Visualize o local antes de reservar</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <PhotoGallery photos={fotosArray} />
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}

            <Card className="premium-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getIcon(areaData.nome, areaData.icone)}</div>
                  <div>
                    <CardTitle>{areaData.nome}</CardTitle>
                    <CardDescription>Selecione a data da reserva</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <div className="grid gap-2 grid-cols-4 md:grid-cols-7">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(format(date, 'yyyy-MM-dd'));
                      setStep(3);
                    }}
                    className={`
                      p-3 rounded-lg border text-center transition-all
                      ${selectedDate === format(date, 'yyyy-MM-dd')
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-xs text-muted-foreground capitalize">
                      {format(date, 'EEE', { locale: ptBR })}
                    </div>
                    <div className="font-medium">{format(date, 'd')}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(date, 'MMM', { locale: ptBR })}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              </div>
            </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === 3 && areaData && (
          <Card className="premium-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getIcon(areaData.nome, areaData.icone)}</div>
                <div>
                  <CardTitle>{areaData.nome}</CardTitle>
                  <CardDescription>
                    {format(new Date(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                {faixasHorario.length > 0 ? (
                  faixasHorario.map((faixa, index) => {
                    const available = isHorarioAvailable(faixa.horaInicio, faixa.horaFim);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (available) {
                            setSelectedHorario({ inicio: faixa.horaInicio, fim: faixa.horaFim });
                            setStep(4);
                          }
                        }}
                        disabled={!available}
                        className={`
                          p-4 rounded-lg border text-center transition-all
                          ${!available ? 'opacity-50 cursor-not-allowed bg-muted' : ''}
                          ${selectedHorario?.inicio === faixa.horaInicio
                            ? 'border-primary bg-primary/5'
                            : available ? 'border-border hover:border-primary/50' : ''
                          }
                        `}
                      >
                        <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-medium">{faixa.horaInicio}</div>
                        <div className="text-sm text-muted-foreground">até {faixa.horaFim}</div>
                        {!available && (
                          <span className="text-xs text-destructive">Indisponível</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum horário configurado para esta área</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && areaData && selectedHorario && (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Confirmar Reserva</CardTitle>
              <CardDescription>Revise os dados e confirme sua reserva</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getIcon(areaData.nome, areaData.icone)}</div>
                  <div>
                    <h3 className="font-medium">{areaData.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedHorario.inicio} às {selectedHorario.fim}
                    </p>
                  </div>
                </div>
                {areaData.valor && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Valor: R$ {areaData.valor}</span>
                  </div>
                )}
              </div>

              {/* Quantidade de Pessoas */}
              {areaData.capacidadeMaxima && (
                <div className="space-y-2">
                  <Label>Quantidade de Pessoas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={areaData.capacidadeMaxima}
                    value={quantidadePessoas}
                    onChange={(e) => setQuantidadePessoas(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo: {areaData.capacidadeMaxima} pessoas
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Alguma informação adicional..."
                  rows={3}
                />
              </div>

              {/* Regras */}
              {areaData.regras && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Regras de Utilização
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {areaData.regras}
                  </div>
                </div>
              )}

              {/* Termo de Aceite */}
              {areaData.termoAceite && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Termo de Aceite</Label>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {areaData.termoAceite}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="termo"
                      checked={termoAceito}
                      onCheckedChange={(checked) => setTermoAceito(checked as boolean)}
                    />
                    <label htmlFor="termo" className="text-sm">
                      Li e aceito o termo de utilização
                    </label>
                  </div>
                  {termoAceito && (
                    <div className="space-y-2">
                      <Label>Assinatura Digital</Label>
                      <Input
                        value={assinatura}
                        onChange={(e) => setAssinatura(e.target.value)}
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>Voltar</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending || (!!areaData?.termoAceite && !termoAceito)}
                  className="flex-1"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar Reserva
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
