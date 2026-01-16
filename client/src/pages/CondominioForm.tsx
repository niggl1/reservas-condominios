import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function CondominioForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    cnpj: "",
    telefone: "",
    email: "",
  });

  const { data: condominio, isLoading } = trpc.condominios.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: isEditing }
  );

  const createMutation = trpc.condominios.create.useMutation({
    onSuccess: () => {
      toast.success("Condomínio criado com sucesso");
      setLocation("/condominios");
    },
    onError: () => {
      toast.error("Erro ao criar condomínio");
    }
  });

  const updateMutation = trpc.condominios.update.useMutation({
    onSuccess: () => {
      toast.success("Condomínio atualizado com sucesso");
      setLocation("/condominios");
    },
    onError: () => {
      toast.error("Erro ao atualizar condomínio");
    }
  });

  useEffect(() => {
    if (condominio) {
      setFormData({
        nome: condominio.nome || "",
        endereco: condominio.endereco || "",
        cidade: condominio.cidade || "",
        estado: condominio.estado || "",
        cep: condominio.cep || "",
        cnpj: condominio.cnpj || "",
        telefone: condominio.telefone || "",
        email: condominio.email || "",
      });
    }
  }, [condominio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ id: parseInt(params.id!), ...formData });
    } else {
      createMutation.mutate(formData);
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
          <Button variant="ghost" size="icon" onClick={() => setLocation('/condominios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Condomínio" : "Novo Condomínio"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do condomínio" : "Preencha os dados do novo condomínio"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="premium-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais do condomínio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Condomínio *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Residencial das Flores"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@condominio.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setLocation('/condominios')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Criar Condomínio"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
