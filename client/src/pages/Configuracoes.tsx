import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Settings, Building2, Bell, Shield, Loader2, Save, Copy, Check, Sparkles, Link2, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];
  const [copied, setCopied] = useState(false);

  const [globalConfig, setGlobalConfig] = useState({
    limiteGlobalPorHorario: 0,
    limiteGlobalPorDia: 0,
    limiteGlobalPorSemana: 0,
    limiteGlobalPorMes: 0,
    limiteGlobalPorAno: 0,
    notificarAdminReservasPagas: true,
    notificarSindicoReservasPagas: true,
  });

  const updateMutation = trpc.condominios.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    }
  });

  useEffect(() => {
    if (selectedCondominio) {
      setGlobalConfig({
        limiteGlobalPorHorario: 0,
        limiteGlobalPorDia: 0,
        limiteGlobalPorSemana: 0,
        limiteGlobalPorMes: 0,
        limiteGlobalPorAno: 0,
        notificarAdminReservasPagas: true,
        notificarSindicoReservasPagas: true,
      });
    }
  }, [selectedCondominio]);

  const handleSave = () => {
    if (selectedCondominio) {
      updateMutation.mutate({
        id: selectedCondominio.id,
        ...globalConfig,
      });
    }
  };

  const copyLink = () => {
    if (selectedCondominio?.linkCadastro) {
      navigator.clipboard.writeText(`${window.location.origin}/cadastro/${selectedCondominio.linkCadastro}`);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-4xl">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5 p-8 border border-slate-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Configurações</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Configure os parâmetros globais do condomínio
            </p>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="limites" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="limites" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 py-2.5 gap-2">
              <Shield className="h-4 w-4" />
              Limites Globais
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 py-2.5 gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="condominio" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 py-2.5 gap-2">
              <Building2 className="h-4 w-4" />
              Condomínio
            </TabsTrigger>
          </TabsList>

          {/* Limites Tab */}
          <TabsContent value="limites">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Limites Globais de Reservas</CardTitle>
                    <CardDescription>
                      Defina limites que se aplicam a todas as áreas. Deixe 0 para não aplicar limite.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Por Horário</Label>
                    <Input
                      type="number"
                      value={globalConfig.limiteGlobalPorHorario || ""}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        limiteGlobalPorHorario: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Por Dia</Label>
                    <Input
                      type="number"
                      value={globalConfig.limiteGlobalPorDia || ""}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        limiteGlobalPorDia: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Por Semana</Label>
                    <Input
                      type="number"
                      value={globalConfig.limiteGlobalPorSemana || ""}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        limiteGlobalPorSemana: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Por Mês</Label>
                    <Input
                      type="number"
                      value={globalConfig.limiteGlobalPorMes || ""}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        limiteGlobalPorMes: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Por Ano</Label>
                    <Input
                      type="number"
                      value={globalConfig.limiteGlobalPorAno || ""}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        limiteGlobalPorAno: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <p className="text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 inline mr-2 text-violet-600" />
                    Estes limites se somam aos limites individuais de cada área. 
                    Por exemplo, se o limite global por dia é 2 e o morador já fez 2 reservas 
                    em áreas diferentes, ele não poderá fazer mais reservas naquele dia.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Configurações de Notificações</CardTitle>
                    <CardDescription>
                      Defina quem recebe notificações sobre reservas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Notificar Administradora sobre Reservas Pagas</Label>
                    <p className="text-sm text-muted-foreground">
                      A administradora receberá notificação quando houver reserva em área com valor
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.notificarAdminReservasPagas}
                    onCheckedChange={(checked) => setGlobalConfig({ 
                      ...globalConfig, 
                      notificarAdminReservasPagas: checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Notificar Síndico sobre Reservas Pagas</Label>
                    <p className="text-sm text-muted-foreground">
                      O síndico receberá notificação quando houver reserva em área com valor
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.notificarSindicoReservasPagas}
                    onCheckedChange={(checked) => setGlobalConfig({ 
                        ...globalConfig, 
                        notificarSindicoReservasPagas: checked 
                      })}
                  />
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-muted-foreground">
                    <Bell className="h-4 w-4 inline mr-2 text-amber-600" />
                    Áreas sem valor não geram notificações automáticas para síndico/administradora.
                    Configure notificações específicas por área na página de edição da área.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Condomínio Tab */}
          <TabsContent value="condominio">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Dados do Condomínio</CardTitle>
                    <CardDescription>
                      Informações básicas do condomínio
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Condomínio</Label>
                  <Input
                    value={selectedCondominio?.nome || ""}
                    disabled
                    className="h-11 rounded-xl bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input
                    value={selectedCondominio?.endereco || ""}
                    disabled
                    className="h-11 rounded-xl bg-muted/50"
                  />
                </div>
                
                {/* Link de Cadastro Premium */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-medium">Link de Cadastro de Moradores</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={selectedCondominio?.linkCadastro ? `${window.location.origin}/cadastro/${selectedCondominio.linkCadastro}` : ""}
                      disabled
                      className="h-11 rounded-xl bg-background/50 font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-11 w-11 rounded-xl shrink-0"
                      onClick={copyLink}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe este link com os moradores para que eles possam se cadastrar no sistema.
                    Os cadastros precisarão de aprovação do síndico.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Premium Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="btn-premium">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
