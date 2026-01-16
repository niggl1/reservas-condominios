import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  Building2, Plus, Search, MapPin, Phone, Mail, MoreVertical, Edit, Trash2, 
  Link2, QrCode, ArrowUpRight, Users, CalendarDays, Home
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

export default function Condominios() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  
  const { data: condominios = [], refetch } = trpc.condominios.list.useQuery();
  const deleteMutation = trpc.condominios.delete.useMutation({
    onSuccess: () => {
      toast.success("Condomínio removido com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao remover condomínio");
    }
  });

  const filteredCondominios = condominios.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (link: string) => {
    const url = `${window.location.origin}/cadastro/${link}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 p-8 border border-violet-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium text-violet-600">Gestão de Condomínios</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Condomínios</h1>
              <p className="text-muted-foreground">
                Gerencie os condomínios cadastrados • {condominios.length} condomínio(s)
              </p>
            </div>
            
            <Button onClick={() => setLocation('/condominios/novo')} className="btn-premium self-start md:self-center">
              <Plus className="h-5 w-5" />
              Novo Condomínio
            </Button>
          </div>
        </div>

        {/* Premium Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-border/50 bg-card focus:border-violet-500/50 focus:ring-violet-500/20"
          />
        </div>

        {/* Grid */}
        {filteredCondominios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 className="h-10 w-10" />
            </div>
            <h3>Nenhum condomínio encontrado</h3>
            <p>{search ? "Tente uma busca diferente" : "Comece cadastrando o primeiro condomínio"}</p>
            {!search && (
              <Button onClick={() => setLocation('/condominios/novo')} className="mt-4 btn-premium">
                <Plus className="h-5 w-5" />
                Cadastrar Condomínio
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCondominios.map((condominio) => (
              <Card 
                key={condominio.id} 
                className="premium-card-interactive group"
                onClick={() => setLocation(`/condominios/${condominio.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="h-6 w-6 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold group-hover:text-violet-600 transition-colors">{condominio.nome}</CardTitle>
                        {condominio.cidade && (
                          <CardDescription className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {condominio.cidade}{condominio.estado && `, ${condominio.estado}`}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setLocation(`/condominios/${condominio.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyLink(condominio.linkCadastro || '')}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate({ id: condominio.id })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {condominio.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-violet-500" />
                        {condominio.telefone}
                      </div>
                    )}
                    {condominio.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-500" />
                        <span className="truncate">{condominio.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      <span>Unidades</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Moradores</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
