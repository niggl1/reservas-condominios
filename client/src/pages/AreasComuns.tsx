import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  Building2, Plus, Search, MoreVertical, Edit, Trash2, Settings, Clock, 
  Users, DollarSign, CheckCircle, XCircle, ImageIcon, MapPin, ArrowUpRight,
  Sparkles, Eye
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

const areaIcons: Record<string, string> = {
  piscina: "🏊",
  churrasqueira: "🍖",
  salao: "🎉",
  academia: "🏋️",
  quadra: "🎾",
  playground: "👶",
  jogos: "🎮",
  spa: "🧘",
  sauna: "🧖",
  cinema: "🎬",
  gourmet: "👨‍🍳",
  coworking: "💻",
  default: "🏢"
};

export default function AreasComuns() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  
  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];
  
  const { data: areas = [], refetch } = trpc.areasComuns.list.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const deleteMutation = trpc.areasComuns.delete.useMutation({
    onSuccess: () => {
      toast.success("Área removida com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao remover área");
    }
  });

  const filteredAreas = areas.filter(a => 
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (nome: string, icone?: string | null) => {
    if (icone) return icone;
    const key = Object.keys(areaIcons).find(k => nome.toLowerCase().includes(k));
    return areaIcons[key || 'default'];
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
                <MapPin className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium text-violet-600">Gestão de Espaços</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Áreas Comuns</h1>
              <p className="text-muted-foreground">
                {selectedCondominio?.nome || "Selecione um condomínio"} • {filteredAreas.length} {filteredAreas.length === 1 ? 'área' : 'áreas'}
              </p>
            </div>
            
            <Button onClick={() => setLocation('/areas/nova')} className="btn-premium self-start md:self-center">
              <Plus className="h-5 w-5" />
              Nova Área
            </Button>
          </div>
        </div>

        {/* Search Bar Premium */}
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar área por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-border/50 bg-card focus:border-violet-500/50 focus:ring-violet-500/20"
          />
        </div>

        {/* Grid */}
        {filteredAreas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 className="h-10 w-10" />
            </div>
            <h3>{search ? "Nenhuma área encontrada" : "Nenhuma área cadastrada"}</h3>
            <p>
              {search ? "Tente uma busca diferente" : "Comece cadastrando a primeira área comum do condomínio"}
            </p>
            {!search && (
              <Button onClick={() => setLocation('/areas/nova')} className="mt-6 btn-premium">
                <Plus className="h-5 w-5" />
                Cadastrar Área
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => (
              <Card 
                key={area.id} 
                className="premium-card-interactive group overflow-hidden"
                onClick={() => setLocation(`/areas/${area.id}`)}
              >
                {/* Image/Icon Header */}
                <div className="relative h-40 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 overflow-hidden">
                  {(() => {
                    try {
                      const fotosArray = area.fotos ? (typeof area.fotos === 'string' ? JSON.parse(area.fotos) : area.fotos) : [];
                      if (Array.isArray(fotosArray) && fotosArray.length > 0) {
                        return (
                          <>
                            <img 
                              src={fotosArray[0]} 
                              alt={area.nome} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {fotosArray.length > 1 && (
                              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
                                <ImageIcon className="h-3 w-3" />
                                {fotosArray.length}
                              </div>
                            )}
                          </>
                        );
                      }
                    } catch {}
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                          {getIcon(area.nome, area.icone)}
                        </span>
                      </div>
                    );
                  })()}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {area.confirmacaoAutomatica ? (
                      <span className="badge-success">
                        <CheckCircle className="h-3 w-3" />
                        Automática
                      </span>
                    ) : (
                      <span className="badge-warning">
                        <Clock className="h-3 w-3" />
                        Manual
                      </span>
                    )}
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setLocation(`/areas/${area.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/areas/${area.id}?tab=horarios`)}>
                          <Clock className="h-4 w-4 mr-2" />
                          Horários
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/areas/${area.id}?tab=config`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate({ id: area.id })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold group-hover:text-violet-600 transition-colors">
                        {area.nome}
                      </CardTitle>
                      {area.descricao && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {area.descricao}
                        </CardDescription>
                      )}
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 py-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacidade</p>
                        <p className="text-sm font-semibold">{area.capacidadeMaxima || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-sm font-semibold">
                          {area.valor ? `R$ ${area.valor}` : 'Grátis'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features badges */}
                  {(area.permitirMultiplasReservas || area.bloquearAposReserva) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                      {area.permitirMultiplasReservas && (
                        <span className="badge-info">
                          <Sparkles className="h-3 w-3" />
                          Múltiplas reservas
                        </span>
                      )}
                      {area.bloquearAposReserva && (
                        <span className="badge-warning">
                          <Clock className="h-3 w-3" />
                          Bloqueia após reserva
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
