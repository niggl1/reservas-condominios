import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Key, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  Clock, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Building2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function Chaves() {
  const { user } = useAuth();
  const [selectedCondominio, setSelectedCondominio] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState("chaves");
  
  // Modais
  const [showNovaChave, setShowNovaChave] = useState(false);
  const [showEditarChave, setShowEditarChave] = useState(false);
  const [showRetirada, setShowRetirada] = useState(false);
  const [showDevolucao, setShowDevolucao] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [chaveAtual, setChaveAtual] = useState<any>(null);
  
  // Formulário de nova/editar chave
  const [formChave, setFormChave] = useState({
    areaId: 0,
    identificacao: "",
    descricao: "",
    quantidade: 1,
  });
  
  // Formulário de retirada/devolução
  const [formMovimentacao, setFormMovimentacao] = useState({
    moradorId: 0,
    reservaId: null as number | null,
    responsavelNome: "",
    observacoes: "",
  });

  // Queries
  const { data: condominios } = trpc.condominios.list.useQuery();
  const { data: areas } = trpc.areasComuns.list.useQuery(
    { condominioId: selectedCondominio! },
    { enabled: !!selectedCondominio }
  );
  const { data: chaves, refetch: refetchChaves } = trpc.chaves.list.useQuery(
    { 
      condominioId: selectedCondominio!,
      areaId: selectedArea || undefined,
      status: statusFilter !== "todos" ? statusFilter as any : undefined,
    },
    { enabled: !!selectedCondominio }
  );
  const { data: chavesPendentes, refetch: refetchPendentes } = trpc.chaves.pendentes.useQuery(
    { condominioId: selectedCondominio! },
    { enabled: !!selectedCondominio }
  );
  const { data: relatorio } = trpc.chaves.relatorio.useQuery(
    { condominioId: selectedCondominio! },
    { enabled: !!selectedCondominio }
  );
  const { data: moradores } = trpc.moradores.list.useQuery(
    { condominioId: selectedCondominio!, status: "aprovado" },
    { enabled: !!selectedCondominio }
  );
  const { data: reservasAtivas } = trpc.reservas.list.useQuery(
    { condominioId: selectedCondominio! },
    { enabled: !!selectedCondominio }
  );
  const { data: historicoChave } = trpc.chaves.historico.useQuery(
    { condominioId: selectedCondominio!, chaveId: chaveAtual?.id },
    { enabled: !!selectedCondominio && !!chaveAtual?.id && showHistorico }
  );

  // Mutations
  const createChave = trpc.chaves.create.useMutation({
    onSuccess: () => {
      toast.success("Chave cadastrada com sucesso!");
      setShowNovaChave(false);
      resetFormChave();
      refetchChaves();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar chave");
    },
  });

  const updateChave = trpc.chaves.update.useMutation({
    onSuccess: () => {
      toast.success("Chave atualizada com sucesso!");
      setShowEditarChave(false);
      resetFormChave();
      refetchChaves();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar chave");
    },
  });

  const deleteChave = trpc.chaves.delete.useMutation({
    onSuccess: () => {
      toast.success("Chave excluída com sucesso!");
      refetchChaves();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir chave");
    },
  });

  const retirarChave = trpc.chaves.retirar.useMutation({
    onSuccess: () => {
      toast.success("Retirada registrada com sucesso!");
      setShowRetirada(false);
      resetFormMovimentacao();
      refetchChaves();
      refetchPendentes();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar retirada");
    },
  });

  const devolverChave = trpc.chaves.devolver.useMutation({
    onSuccess: () => {
      toast.success("Devolução registrada com sucesso!");
      setShowDevolucao(false);
      resetFormMovimentacao();
      refetchChaves();
      refetchPendentes();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar devolução");
    },
  });

  // Helpers
  const resetFormChave = () => {
    setFormChave({
      areaId: 0,
      identificacao: "",
      descricao: "",
      quantidade: 1,
    });
    setChaveAtual(null);
  };

  const resetFormMovimentacao = () => {
    setFormMovimentacao({
      moradorId: 0,
      reservaId: null,
      responsavelNome: "",
      observacoes: "",
    });
    setChaveAtual(null);
  };

  const handleNovaChave = () => {
    resetFormChave();
    setShowNovaChave(true);
  };

  const handleEditarChave = (chave: any) => {
    setChaveAtual(chave);
    setFormChave({
      areaId: chave.areaId,
      identificacao: chave.identificacao,
      descricao: chave.descricao || "",
      quantidade: chave.quantidade,
    });
    setShowEditarChave(true);
  };

  const handleRetirada = (chave: any) => {
    setChaveAtual(chave);
    resetFormMovimentacao();
    setShowRetirada(true);
  };

  const handleDevolucao = (chave: any) => {
    setChaveAtual(chave);
    resetFormMovimentacao();
    setShowDevolucao(true);
  };

  const handleHistorico = (chave: any) => {
    setChaveAtual(chave);
    setShowHistorico(true);
  };

  const submitNovaChave = () => {
    if (!formChave.areaId || !formChave.identificacao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createChave.mutate({
      ...formChave,
      condominioId: selectedCondominio!,
    });
  };

  const submitEditarChave = () => {
    if (!formChave.identificacao) {
      toast.error("Preencha a identificação da chave");
      return;
    }
    updateChave.mutate({
      id: chaveAtual.id,
      identificacao: formChave.identificacao,
      descricao: formChave.descricao,
      quantidade: formChave.quantidade,
    });
  };

  const submitRetirada = () => {
    if (!formMovimentacao.moradorId) {
      toast.error("Selecione o morador");
      return;
    }
    retirarChave.mutate({
      chaveId: chaveAtual.id,
      moradorId: formMovimentacao.moradorId,
      condominioId: selectedCondominio!,
      reservaId: formMovimentacao.reservaId || undefined,
      responsavelNome: formMovimentacao.responsavelNome || undefined,
      observacoes: formMovimentacao.observacoes || undefined,
    });
  };

  const submitDevolucao = () => {
    if (!formMovimentacao.moradorId) {
      toast.error("Selecione o morador");
      return;
    }
    devolverChave.mutate({
      chaveId: chaveAtual.id,
      moradorId: formMovimentacao.moradorId,
      condominioId: selectedCondominio!,
      reservaId: formMovimentacao.reservaId || undefined,
      responsavelNome: formMovimentacao.responsavelNome || undefined,
      observacoes: formMovimentacao.observacoes || undefined,
    });
  };

  // Filtro de chaves
  const chavesFiltradas = useMemo(() => {
    if (!chaves) return [];
    return chaves.filter((chave) => {
      const matchSearch = 
        chave.identificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chave.areaNome?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [chaves, searchTerm]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponivel":
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Disponível</Badge>;
      case "em_uso":
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Em Uso</Badge>;
      case "perdida":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Perdida</Badge>;
      case "manutencao":
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Auto-select condomínio para síndico
  useMemo(() => {
    if (user?.role === "sindico" && condominios?.length === 1) {
      setSelectedCondominio(condominios[0].id);
    }
  }, [user, condominios]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <Key className="h-8 w-8 text-amber-600" />
              Controle de Chaves
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as chaves das áreas comuns do condomínio
            </p>
          </div>
          {selectedCondominio && (
            <Button 
              onClick={handleNovaChave}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Chave
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card className="border-amber-200/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Condomínio</Label>
                <Select
                  value={selectedCondominio?.toString() || ""}
                  onValueChange={(v) => {
                    setSelectedCondominio(Number(v));
                    setSelectedArea(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Área</Label>
                <Select
                  value={selectedArea?.toString() || "todas"}
                  onValueChange={(v) => setSelectedArea(v === "todas" ? null : Number(v))}
                  disabled={!selectedCondominio}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as áreas</SelectItem>
                    {areas?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="perdida">Perdida</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar chave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedCondominio ? (
          <Card className="border-amber-200/50">
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-amber-300 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Selecione um condomínio para gerenciar as chaves
              </h3>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="chaves" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Chaves
              </TabsTrigger>
              <TabsTrigger value="pendentes" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendentes
                {chavesPendentes && chavesPendentes.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{chavesPendentes.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="relatorio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Relatório
              </TabsTrigger>
            </TabsList>

            {/* Tab: Lista de Chaves */}
            <TabsContent value="chaves">
              {chavesFiltradas.length === 0 ? (
                <Card className="border-amber-200/50">
                  <CardContent className="py-12 text-center">
                    <Key className="h-16 w-16 mx-auto text-amber-300 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhuma chave cadastrada
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Nova Chave" para cadastrar a primeira chave
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chavesFiltradas.map((chave) => (
                    <Card key={chave.id} className="border-amber-200/50 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                              <Key className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{chave.identificacao}</CardTitle>
                              <CardDescription>{chave.areaNome}</CardDescription>
                            </div>
                          </div>
                          {getStatusBadge(chave.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {chave.descricao && (
                          <p className="text-sm text-muted-foreground mb-3">{chave.descricao}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span>Quantidade: {chave.quantidade}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {chave.status === "disponivel" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRetirada(chave)}
                              className="flex-1"
                            >
                              <ArrowUpFromLine className="h-4 w-4 mr-1" />
                              Retirar
                            </Button>
                          )}
                          {chave.status === "em_uso" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDevolucao(chave)}
                              className="flex-1"
                            >
                              <ArrowDownToLine className="h-4 w-4 mr-1" />
                              Devolver
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleHistorico(chave)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditarChave(chave)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta chave?")) {
                                deleteChave.mutate({ id: chave.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Chaves Pendentes */}
            <TabsContent value="pendentes">
              {!chavesPendentes || chavesPendentes.length === 0 ? (
                <Card className="border-green-200/50 bg-green-50/50">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-green-700">
                      Todas as chaves foram devolvidas
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      Não há chaves pendentes de devolução
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card className="border-yellow-200/50 bg-yellow-50/50">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">{chavesPendentes.length} chave(s) pendente(s) de devolução</span>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chavesPendentes.map((item: any) => (
                      <Card key={item.id} className="border-yellow-200/50 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                                <Key className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{item.identificacao}</CardTitle>
                                <CardDescription>{item.areaNome}</CardDescription>
                              </div>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                              <Clock className="w-3 h-3 mr-1" /> Em Uso
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{item.retirada?.moradorNome}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>
                                {item.retirada?.moradorBloco && `Bloco ${item.retirada.moradorBloco} - `}
                                Unidade {item.retirada?.moradorUnidade}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Retirada: {item.retirada?.dataHora && new Date(item.retirada.dataHora).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            {item.retirada?.responsavelNome && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Entregue por: {item.retirada.responsavelNome}</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            onClick={() => {
                              setChaveAtual(item);
                              setFormMovimentacao({
                                moradorId: item.retirada?.moradorId || 0,
                                reservaId: item.retirada?.reservaId || null,
                                responsavelNome: "",
                                observacoes: "",
                              });
                              setShowDevolucao(true);
                            }}
                          >
                            <ArrowDownToLine className="h-4 w-4 mr-2" />
                            Registrar Devolução
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Relatório */}
            <TabsContent value="relatorio">
              {relatorio && (
                <div className="space-y-6">
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="border-amber-200/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-amber-600">{(relatorio.resumo as any)?.total || 0}</div>
                          <div className="text-sm text-muted-foreground">Total de Chaves</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{(relatorio.resumo as any)?.disponiveis || 0}</div>
                          <div className="text-sm text-muted-foreground">Disponíveis</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-600">{(relatorio.resumo as any)?.emUso || 0}</div>
                          <div className="text-sm text-muted-foreground">Em Uso</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">{(relatorio.resumo as any)?.perdidas || 0}</div>
                          <div className="text-sm text-muted-foreground">Perdidas</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{(relatorio.resumo as any)?.manutencao || 0}</div>
                          <div className="text-sm text-muted-foreground">Manutenção</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Últimas movimentações */}
                  <Card className="border-amber-200/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-amber-600" />
                        Últimas Movimentações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {relatorio.movimentacoes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma movimentação registrada
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {relatorio.movimentacoes.slice(0, 10).map((mov: any) => (
                            <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                {mov.tipo === "retirada" ? (
                                  <div className="p-2 rounded-full bg-yellow-100">
                                    <ArrowUpFromLine className="h-4 w-4 text-yellow-600" />
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-full bg-green-100">
                                    <ArrowDownToLine className="h-4 w-4 text-green-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {mov.chaveIdentificacao} - {mov.areaNome}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {mov.moradorNome} • {mov.tipo === "retirada" ? "Retirada" : "Devolução"}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(mov.dataHora).toLocaleString("pt-BR")}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Modal: Nova Chave */}
      <Dialog open={showNovaChave} onOpenChange={setShowNovaChave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              Nova Chave
            </DialogTitle>
            <DialogDescription>
              Cadastre uma nova chave para uma área comum
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Área Comum *</Label>
              <Select
                value={formChave.areaId.toString()}
                onValueChange={(v) => setFormChave({ ...formChave, areaId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Identificação *</Label>
              <Input
                placeholder="Ex: Chave Principal, Cópia 1, etc."
                value={formChave.identificacao}
                onChange={(e) => setFormChave({ ...formChave, identificacao: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição adicional da chave (opcional)"
                value={formChave.descricao}
                onChange={(e) => setFormChave({ ...formChave, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={formChave.quantidade}
                onChange={(e) => setFormChave({ ...formChave, quantidade: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovaChave(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitNovaChave}
              disabled={createChave.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {createChave.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Chave */}
      <Dialog open={showEditarChave} onOpenChange={setShowEditarChave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" />
              Editar Chave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Identificação *</Label>
              <Input
                placeholder="Ex: Chave Principal, Cópia 1, etc."
                value={formChave.identificacao}
                onChange={(e) => setFormChave({ ...formChave, identificacao: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição adicional da chave (opcional)"
                value={formChave.descricao}
                onChange={(e) => setFormChave({ ...formChave, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={formChave.quantidade}
                onChange={(e) => setFormChave({ ...formChave, quantidade: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={chaveAtual?.status || "disponivel"}
                onValueChange={(v) => {
                  updateChave.mutate({ id: chaveAtual.id, status: v as any });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="perdida">Perdida</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditarChave(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitEditarChave}
              disabled={updateChave.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {updateChave.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Retirada */}
      <Dialog open={showRetirada} onOpenChange={setShowRetirada}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-yellow-600" />
              Registrar Retirada
            </DialogTitle>
            <DialogDescription>
              Chave: {chaveAtual?.identificacao} - {chaveAtual?.areaNome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Morador *</Label>
              <Select
                value={formMovimentacao.moradorId.toString()}
                onValueChange={(v) => setFormMovimentacao({ ...formMovimentacao, moradorId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o morador" />
                </SelectTrigger>
                <SelectContent>
                  {moradores?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nome} - {m.unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vincular à Reserva (opcional)</Label>
              <Select
                value={formMovimentacao.reservaId?.toString() || "nenhuma"}
                onValueChange={(v) => setFormMovimentacao({ 
                  ...formMovimentacao, 
                  reservaId: v === "nenhuma" ? null : Number(v) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma reserva" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma reserva</SelectItem>
                  {reservasAtivas?.filter((r) => r.areaId === chaveAtual?.areaId).map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.protocolo} - {new Date(r.dataReserva).toLocaleDateString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável pela Entrega</Label>
              <Input
                placeholder="Nome do porteiro/síndico que entregou"
                value={formMovimentacao.responsavelNome}
                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, responsavelNome: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais (opcional)"
                value={formMovimentacao.observacoes}
                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetirada(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitRetirada}
              disabled={retirarChave.isPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              {retirarChave.isPending ? "Registrando..." : "Registrar Retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Devolução */}
      <Dialog open={showDevolucao} onOpenChange={setShowDevolucao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-green-600" />
              Registrar Devolução
            </DialogTitle>
            <DialogDescription>
              Chave: {chaveAtual?.identificacao} - {chaveAtual?.areaNome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Morador *</Label>
              <Select
                value={formMovimentacao.moradorId.toString()}
                onValueChange={(v) => setFormMovimentacao({ ...formMovimentacao, moradorId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o morador" />
                </SelectTrigger>
                <SelectContent>
                  {moradores?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nome} - {m.unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável pelo Recebimento</Label>
              <Input
                placeholder="Nome do porteiro/síndico que recebeu"
                value={formMovimentacao.responsavelNome}
                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, responsavelNome: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais (opcional)"
                value={formMovimentacao.observacoes}
                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolucao(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitDevolucao}
              disabled={devolverChave.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {devolverChave.isPending ? "Registrando..." : "Registrar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Histórico de Movimentação
            </DialogTitle>
            <DialogDescription>
              Chave: {chaveAtual?.identificacao} - {chaveAtual?.areaNome}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {!historicoChave || historicoChave.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação registrada para esta chave
              </p>
            ) : (
              <div className="space-y-3">
                {historicoChave.map((mov: any) => (
                  <div key={mov.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {mov.tipo === "retirada" ? (
                      <div className="p-2 rounded-full bg-yellow-100 mt-1">
                        <ArrowUpFromLine className="h-4 w-4 text-yellow-600" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-green-100 mt-1">
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {mov.tipo === "retirada" ? "Retirada" : "Devolução"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(mov.dataHora).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Morador: {mov.moradorNome}</p>
                        {mov.responsavelNome && <p>Responsável: {mov.responsavelNome}</p>}
                        {mov.observacoes && <p className="mt-1 italic">"{mov.observacoes}"</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistorico(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
