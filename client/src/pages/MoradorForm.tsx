import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function MoradorForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    tipo: "proprietario" as "proprietario" | "inquilino" | "dependente",
    unidadeId: 0,
    isResponsavel: false,
  });

  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];

  const { data: unidades = [] } = trpc.unidades.list.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const { data: morador, isLoading } = trpc.moradores.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: isEditing }
  );

  const createMutation = trpc.moradores.create.useMutation({
    onSuccess: () => {
      toast.success("Morador cadastrado com sucesso");
      setLocation("/moradores");
    },
    onError: () => {
      toast.error("Erro ao cadastrar morador");
    }
  });

  const updateMutation = trpc.moradores.update.useMutation({
    onSuccess: () => {
      toast.success("Morador atualizado com sucesso");
      setLocation("/moradores");
    },
    onError: () => {
      toast.error("Erro ao atualizar morador");
    }
  });

  useEffect(() => {
    if (morador) {
      setFormData({
        nome: morador.nome || "",
        email: morador.email || "",
        telefone: morador.telefone || "",
        cpf: morador.cpf || "",
        tipo: (morador.tipo as "proprietario" | "inquilino" | "dependente") || "proprietario",
        unidadeId: morador.unidadeId || 0,
        isResponsavel: morador.isResponsavel || false,
      });
    }
  }, [morador]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.unidadeId) {
      toast.error("Selecione uma unidade");
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(params.id!), ...formData });
    } else {
      createMutation.mutate({
        condominioId: selectedCondominio?.id ?? 0,
        ...formData,
        status: 'aprovado',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/moradores')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Morador" : "Novo Morador"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do morador" : "Preencha os dados do novo morador"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="premium-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Informações do Morador</CardTitle>
                  <CardDescription>Dados pessoais e de contato</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do morador"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "proprietario" | "inquilino" | "dependente") => 
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprietario">Proprietário</SelectItem>
                      <SelectItem value="inquilino">Inquilino</SelectItem>
                      <SelectItem value="dependente">Dependente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={formData.unidadeId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, unidadeId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id.toString()}>
                        {unidade.numero} {unidade.blocoId && `- Bloco ${unidade.blocoId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Responsável pela Unidade</Label>
                  <p className="text-sm text-muted-foreground">
                    Marque se este morador é o responsável principal
                  </p>
                </div>
                <Switch
                  checked={formData.isResponsavel}
                  onCheckedChange={(checked) => setFormData({ ...formData, isResponsavel: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setLocation('/moradores')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Cadastrar Morador"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
