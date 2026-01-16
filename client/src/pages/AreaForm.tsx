import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Loader2, Clock, Settings, Shield, Bell, Plus, Trash2, ImageIcon } from "lucide-react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function AreaForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;

  const [fotos, setFotos] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    icone: "",
    regras: "",
    termoAceite: "",
    valor: "",
    capacidadeMaxima: 0,
    diasMinimoAntecedencia: 0,
    diasMaximoAntecedencia: 30,
    diasMinimoCancelamento: 1,
    limiteReservasPorHorario: 1,
    limiteReservasPorDia: 0,
    limiteReservasPorSemana: 0,
    limiteReservasPorMes: 0,
    limiteReservasPorAno: 0,
    limiteUnidadePorHorario: 1,
    limiteUnidadePorDia: 0,
    limiteUnidadePorSemana: 0,
    limiteUnidadePorMes: 0,
    limiteUnidadePorAno: 0,
    limiteMoradorPorHorario: 1,
    limiteMoradorPorDia: 0,
    limiteMoradorPorSemana: 0,
    limiteMoradorPorMes: 0,
    limiteMoradorPorAno: 0,
    confirmacaoAutomatica: true,
    permitirMultiplasReservas: false,
    bloquearAposReserva: false,
    notificarAgendamento: false,
    notificarCancelamento: false,
    linkPagamento: "",
  });

  const [faixasHorario, setFaixasHorario] = useState<Array<{
    id?: number;
    horaInicio: string;
    horaFim: string;
    diasSemana: number[];
  }>>([]);

  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];

  const { data: area, isLoading } = trpc.areasComuns.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: isEditing }
  );

  const { data: faixas = [] } = trpc.faixasHorario.list.useQuery(
    { areaId: parseInt(params.id || "0") },
    { enabled: isEditing }
  );

  const createMutation = trpc.areasComuns.create.useMutation({
    onSuccess: () => {
      toast.success("Área criada com sucesso");
      setLocation("/areas");
    },
    onError: () => {
      toast.error("Erro ao criar área");
    }
  });

  const updateMutation = trpc.areasComuns.update.useMutation({
    onSuccess: () => {
      toast.success("Área atualizada com sucesso");
      setLocation("/areas");
    },
    onError: () => {
      toast.error("Erro ao atualizar área");
    }
  });

  const createFaixaMutation = trpc.faixasHorario.create.useMutation();
  const deleteFaixaMutation = trpc.faixasHorario.delete.useMutation();

  useEffect(() => {
    if (area) {
      setFormData({
        nome: area.nome || "",
        descricao: area.descricao || "",
        icone: area.icone || "",
        regras: area.regras || "",
        termoAceite: area.termoAceite || "",
        valor: area.valor || "",
        capacidadeMaxima: area.capacidadeMaxima || 0,
        diasMinimoAntecedencia: area.diasMinimoAntecedencia || 0,
        diasMaximoAntecedencia: area.diasMaximoAntecedencia || 30,
        diasMinimoCancelamento: area.diasMinimoCancelamento || 1,
        limiteReservasPorHorario: area.limiteReservasPorHorario || 1,
        limiteReservasPorDia: area.limiteReservasPorDia || 0,
        limiteReservasPorSemana: area.limiteReservasPorSemana || 0,
        limiteReservasPorMes: area.limiteReservasPorMes || 0,
        limiteReservasPorAno: area.limiteReservasPorAno || 0,
        limiteUnidadePorHorario: area.limiteUnidadePorHorario || 1,
        limiteUnidadePorDia: area.limiteUnidadePorDia || 0,
        limiteUnidadePorSemana: area.limiteUnidadePorSemana || 0,
        limiteUnidadePorMes: area.limiteUnidadePorMes || 0,
        limiteUnidadePorAno: area.limiteUnidadePorAno || 0,
        limiteMoradorPorHorario: area.limiteMoradorPorHorario || 1,
        limiteMoradorPorDia: area.limiteMoradorPorDia || 0,
        limiteMoradorPorSemana: area.limiteMoradorPorSemana || 0,
        limiteMoradorPorMes: area.limiteMoradorPorMes || 0,
        limiteMoradorPorAno: area.limiteMoradorPorAno || 0,
        confirmacaoAutomatica: area.confirmacaoAutomatica ?? true,
        permitirMultiplasReservas: area.permitirMultiplasReservas ?? false,
        bloquearAposReserva: area.bloquearAposReserva ?? false,
        notificarAgendamento: area.notificarAgendamento ?? false,
        notificarCancelamento: area.notificarCancelamento ?? false,
        linkPagamento: area.linkPagamento || "",
      });
      // Carregar fotos existentes
      if (area.fotos) {
        try {
          const fotosArray = typeof area.fotos === 'string' ? JSON.parse(area.fotos) : area.fotos;
          setFotos(Array.isArray(fotosArray) ? fotosArray : []);
        } catch {
          setFotos([]);
        }
      }
    }
  }, [area]);

  useEffect(() => {
    if (faixas.length > 0) {
      setFaixasHorario(faixas.map(f => ({
        id: f.id,
        horaInicio: f.horaInicio,
        horaFim: f.horaFim,
        diasSemana: f.diasSemana ? (typeof f.diasSemana === 'string' ? JSON.parse(f.diasSemana) : f.diasSemana) : [0, 1, 2, 3, 4, 5, 6],
      })));
    }
  }, [faixas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    const dataToSend = {
      ...formData,
      fotos: fotos,
    };

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(params.id!), ...dataToSend });
    } else {
      createMutation.mutate({
        condominioId: selectedCondominio?.id ?? 0,
        ...dataToSend,
      });
    }
  };

  const addFaixaHorario = () => {
    setFaixasHorario([...faixasHorario, {
      horaInicio: "08:00",
      horaFim: "10:00",
      diasSemana: [0, 1, 2, 3, 4, 5, 6],
    }]);
  };

  const removeFaixaHorario = async (index: number) => {
    const faixa = faixasHorario[index];
    if (faixa.id) {
      await deleteFaixaMutation.mutateAsync({ id: faixa.id });
    }
    setFaixasHorario(faixasHorario.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const diasSemana = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
  ];

  if (isEditing && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/areas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Área" : "Nova Área"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as configurações da área" : "Configure a nova área comum"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="info" className="gap-2">
              <Building2 className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="fotos" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="horarios" className="gap-2">
              <Clock className="h-4 w-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="limites" className="gap-2">
              <Shield className="h-4 w-4" />
              Limites
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Info Tab */}
            <TabsContent value="info">
              <Card className="premium-card max-w-2xl">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais da área comum</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Ícone</Label>
                      <Input
                        value={formData.icone}
                        onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                        placeholder="🏊"
                        className="text-center text-2xl"
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Piscina, Churrasqueira..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição da área..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="0,00 (deixe vazio se gratuito)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacidade Máxima</Label>
                      <Input
                        type="number"
                        value={formData.capacidadeMaxima || ""}
                        onChange={(e) => setFormData({ ...formData, capacidadeMaxima: parseInt(e.target.value) || 0 })}
                        placeholder="Número de pessoas"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Link de Pagamento</Label>
                    <Input
                      value={formData.linkPagamento}
                      onChange={(e) => setFormData({ ...formData, linkPagamento: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Regras de Utilização</Label>
                    <Textarea
                      value={formData.regras}
                      onChange={(e) => setFormData({ ...formData, regras: e.target.value })}
                      placeholder="Regras para uso da área..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Termo de Aceite</Label>
                    <Textarea
                      value={formData.termoAceite}
                      onChange={(e) => setFormData({ ...formData, termoAceite: e.target.value })}
                      placeholder="Termo que o morador deve aceitar ao reservar..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fotos Tab */}
            <TabsContent value="fotos">
              <Card className="premium-card max-w-2xl">
                <CardHeader>
                  <CardTitle>Galeria de Fotos</CardTitle>
                  <CardDescription>
                    Adicione fotos da área para que os moradores possam visualizar o espaço antes de reservar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={fotos}
                    onChange={setFotos}
                    maxPhotos={10}
                    maxSizeMB={100}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horários Tab */}
            <TabsContent value="horarios">
              <Card className="premium-card max-w-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Faixas de Horário</CardTitle>
                      <CardDescription>Configure os horários disponíveis para reserva</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFaixaHorario}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faixasHorario.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma faixa de horário configurada</p>
                      <Button type="button" variant="link" onClick={addFaixaHorario}>
                        Adicionar primeira faixa
                      </Button>
                    </div>
                  ) : (
                    faixasHorario.map((faixa, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Faixa {index + 1}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFaixaHorario(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Hora Início</Label>
                            <Input
                              type="time"
                              value={faixa.horaInicio}
                              onChange={(e) => {
                                const newFaixas = [...faixasHorario];
                                newFaixas[index].horaInicio = e.target.value;
                                setFaixasHorario(newFaixas);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hora Fim</Label>
                            <Input
                              type="time"
                              value={faixa.horaFim}
                              onChange={(e) => {
                                const newFaixas = [...faixasHorario];
                                newFaixas[index].horaFim = e.target.value;
                                setFaixasHorario(newFaixas);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Dias da Semana</Label>
                          <div className="flex gap-2">
                            {diasSemana.map((dia) => (
                              <Button
                                key={dia.value}
                                type="button"
                                variant={faixa.diasSemana.includes(dia.value) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const newFaixas = [...faixasHorario];
                                  if (faixa.diasSemana.includes(dia.value)) {
                                    newFaixas[index].diasSemana = faixa.diasSemana.filter(d => d !== dia.value);
                                  } else {
                                    newFaixas[index].diasSemana = [...faixa.diasSemana, dia.value].sort();
                                  }
                                  setFaixasHorario(newFaixas);
                                }}
                              >
                                {dia.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Limites Tab */}
            <TabsContent value="limites">
              <div className="grid gap-6 max-w-4xl">
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Limites por Área</CardTitle>
                    <CardDescription>Quantidade máxima de reservas simultâneas nesta área</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Por Horário</Label>
                        <Input
                          type="number"
                          value={formData.limiteReservasPorHorario || ""}
                          onChange={(e) => setFormData({ ...formData, limiteReservasPorHorario: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Dia</Label>
                        <Input
                          type="number"
                          value={formData.limiteReservasPorDia || ""}
                          onChange={(e) => setFormData({ ...formData, limiteReservasPorDia: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Semana</Label>
                        <Input
                          type="number"
                          value={formData.limiteReservasPorSemana || ""}
                          onChange={(e) => setFormData({ ...formData, limiteReservasPorSemana: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Mês</Label>
                        <Input
                          type="number"
                          value={formData.limiteReservasPorMes || ""}
                          onChange={(e) => setFormData({ ...formData, limiteReservasPorMes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Ano</Label>
                        <Input
                          type="number"
                          value={formData.limiteReservasPorAno || ""}
                          onChange={(e) => setFormData({ ...formData, limiteReservasPorAno: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Limites por Unidade</CardTitle>
                    <CardDescription>Quantidade máxima de reservas por unidade/apartamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Por Horário</Label>
                        <Input
                          type="number"
                          value={formData.limiteUnidadePorHorario || ""}
                          onChange={(e) => setFormData({ ...formData, limiteUnidadePorHorario: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Dia</Label>
                        <Input
                          type="number"
                          value={formData.limiteUnidadePorDia || ""}
                          onChange={(e) => setFormData({ ...formData, limiteUnidadePorDia: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Semana</Label>
                        <Input
                          type="number"
                          value={formData.limiteUnidadePorSemana || ""}
                          onChange={(e) => setFormData({ ...formData, limiteUnidadePorSemana: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Mês</Label>
                        <Input
                          type="number"
                          value={formData.limiteUnidadePorMes || ""}
                          onChange={(e) => setFormData({ ...formData, limiteUnidadePorMes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Ano</Label>
                        <Input
                          type="number"
                          value={formData.limiteUnidadePorAno || ""}
                          onChange={(e) => setFormData({ ...formData, limiteUnidadePorAno: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Limites por Morador</CardTitle>
                    <CardDescription>Quantidade máxima de reservas por morador individual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Por Horário</Label>
                        <Input
                          type="number"
                          value={formData.limiteMoradorPorHorario || ""}
                          onChange={(e) => setFormData({ ...formData, limiteMoradorPorHorario: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Dia</Label>
                        <Input
                          type="number"
                          value={formData.limiteMoradorPorDia || ""}
                          onChange={(e) => setFormData({ ...formData, limiteMoradorPorDia: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Semana</Label>
                        <Input
                          type="number"
                          value={formData.limiteMoradorPorSemana || ""}
                          onChange={(e) => setFormData({ ...formData, limiteMoradorPorSemana: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Mês</Label>
                        <Input
                          type="number"
                          value={formData.limiteMoradorPorMes || ""}
                          onChange={(e) => setFormData({ ...formData, limiteMoradorPorMes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Por Ano</Label>
                        <Input
                          type="number"
                          value={formData.limiteMoradorPorAno || ""}
                          onChange={(e) => setFormData({ ...formData, limiteMoradorPorAno: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Antecedência e Cancelamento</CardTitle>
                    <CardDescription>Configure os prazos para reserva e cancelamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Dias Mínimos de Antecedência</Label>
                        <Input
                          type="number"
                          value={formData.diasMinimoAntecedencia || ""}
                          onChange={(e) => setFormData({ ...formData, diasMinimoAntecedencia: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">0 = pode reservar no mesmo dia</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Dias Máximos de Antecedência</Label>
                        <Input
                          type="number"
                          value={formData.diasMaximoAntecedencia || ""}
                          onChange={(e) => setFormData({ ...formData, diasMaximoAntecedencia: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">Quantos dias no futuro pode reservar</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Dias Mínimos para Cancelamento</Label>
                        <Input
                          type="number"
                          value={formData.diasMinimoCancelamento || ""}
                          onChange={(e) => setFormData({ ...formData, diasMinimoCancelamento: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">Prazo mínimo para cancelar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config">
              <Card className="premium-card max-w-2xl">
                <CardHeader>
                  <CardTitle>Configurações da Área</CardTitle>
                  <CardDescription>Opções de funcionamento e notificações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Confirmação Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Reservas são confirmadas automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={formData.confirmacaoAutomatica}
                      onCheckedChange={(checked) => setFormData({ ...formData, confirmacaoAutomatica: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir Múltiplas Reservas</Label>
                      <p className="text-sm text-muted-foreground">
                        Mais de uma pessoa pode reservar o mesmo horário (ex: academia)
                      </p>
                    </div>
                    <Switch
                      checked={formData.permitirMultiplasReservas}
                      onCheckedChange={(checked) => setFormData({ ...formData, permitirMultiplasReservas: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bloquear Após Reserva</Label>
                      <p className="text-sm text-muted-foreground">
                        Só permite nova reserva após utilização da atual
                      </p>
                    </div>
                    <Switch
                      checked={formData.bloquearAposReserva}
                      onCheckedChange={(checked) => setFormData({ ...formData, bloquearAposReserva: checked })}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notificações
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificar Agendamento</Label>
                          <p className="text-sm text-muted-foreground">
                            Síndico/Administradora recebe aviso de nova reserva
                          </p>
                        </div>
                        <Switch
                          checked={formData.notificarAgendamento}
                          onCheckedChange={(checked) => setFormData({ ...formData, notificarAgendamento: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificar Cancelamento</Label>
                          <p className="text-sm text-muted-foreground">
                            Síndico/Administradora recebe aviso de cancelamento
                          </p>
                        </div>
                        <Switch
                          checked={formData.notificarCancelamento}
                          onCheckedChange={(checked) => setFormData({ ...formData, notificarCancelamento: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 mt-6 max-w-2xl">
              <Button type="button" variant="outline" onClick={() => setLocation('/areas')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Área"}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
