import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function Cadastro() {
  const params = useParams<{ link: string }>();
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    tipo: "proprietario" as "proprietario" | "inquilino" | "dependente",
    bloco: "",
    unidade: "",
  });

  const { data: condominio, isLoading } = trpc.condominios.getByLink.useQuery(
    { link: params.link || "" },
    { enabled: !!params.link }
  );

  const { data: blocos = [] } = trpc.blocos.list.useQuery(
    { condominioId: condominio?.id ?? 0 },
    { enabled: !!condominio }
  );

  const createMutation = trpc.moradores.autoCadastro.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar cadastro");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.unidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      linkCondominio: params.link || "",
      unidadeId: parseInt(formData.unidade) || 0,
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone || undefined,
      cpf: formData.cpf || undefined,
      tipo: formData.tipo,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!condominio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Link inválido</h3>
            <p className="text-muted-foreground text-center">
              O link de cadastro não é válido ou expirou
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Cadastro Enviado!</h3>
            <p className="text-muted-foreground text-center">
              Seu cadastro foi enviado para aprovação. Você receberá um e-mail quando for aprovado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{condominio.nome}</CardTitle>
          <CardDescription>
            Preencha seus dados para solicitar acesso ao sistema de reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
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

            {blocos.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bloco">Bloco</Label>
                <Select
                  value={formData.bloco}
                  onValueChange={(value) => setFormData({ ...formData, bloco: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o bloco" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocos.map((bloco) => (
                      <SelectItem key={bloco.id} value={bloco.id.toString()}>
                        {bloco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade/Apartamento *</Label>
              <Input
                id="unidade"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                placeholder="Ex: 101, 202..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Cadastro
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
