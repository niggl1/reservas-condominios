import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  Users, Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Ban, 
  CheckCircle, XCircle, Home, Link2, QrCode, FileSpreadsheet, ArrowUpRight,
  UserCheck, Copy, Download
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportarMoradoresExcel } from "@/components/ImportarMoradoresExcel";

export default function Moradores() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; moradorId: number | null }>({ open: false, moradorId: null });
  const [blockReason, setBlockReason] = useState("");
  const [linkDialog, setLinkDialog] = useState(false);
  
  const { data: condominios = [] } = trpc.condominios.list.useQuery();
  const selectedCondominio = condominios[0];
  
  const { data: moradores = [], refetch } = trpc.moradores.list.useQuery(
    { condominioId: selectedCondominio?.id ?? 0 },
    { enabled: !!selectedCondominio }
  );

  const bloquearMutation = trpc.moradores.bloquear.useMutation({
    onSuccess: () => {
      toast.success("Morador bloqueado");
      refetch();
      setBlockDialog({ open: false, moradorId: null });
      setBlockReason("");
    }
  });

  const desbloquearMutation = trpc.moradores.desbloquear.useMutation({
    onSuccess: () => {
      toast.success("Morador desbloqueado");
      refetch();
    }
  });

  const deleteMutation = trpc.moradores.delete.useMutation({
    onSuccess: () => {
      toast.success("Morador removido");
      refetch();
    }
  });

  const filteredMoradores = moradores.filter(m => 
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.telefone?.includes(search)
  );

  const copyLink = () => {
    if (selectedCondominio?.linkCadastro) {
      const url = `${window.location.origin}/cadastro/${selectedCondominio.linkCadastro}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const getStatusBadge = (status: string, isBlocked: boolean) => {
    if (isBlocked) return <span className="badge-destructive"><Ban className="h-3 w-3" />Bloqueado</span>;
    if (status === 'aprovado') return <span className="badge-success"><CheckCircle className="h-3 w-3" />Aprovado</span>;
    if (status === 'pendente') return <span className="badge-warning"><UserCheck className="h-3 w-3" />Pendente</span>;
    return <span className="badge-destructive"><XCircle className="h-3 w-3" />Rejeitado</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-teal-500/5 p-8 border border-blue-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Gestão de Moradores</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Moradores</h1>
              <p className="text-muted-foreground">
                {selectedCondominio?.nome || "Selecione um condomínio"} • {moradores.length} morador(es)
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 self-start md:self-center">
              <Button variant="outline" onClick={() => setLinkDialog(true)} className="gap-2 rounded-xl border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30">
                <Link2 className="h-4 w-4" />
                Link de Cadastro
              </Button>
              {selectedCondominio && (
                <ImportarMoradoresExcel 
                  condominioId={selectedCondominio.id} 
                  condominioNome={selectedCondominio.nome}
                  onSuccess={() => refetch()}
                />
              )}
              <Button onClick={() => setLocation('/moradores/novo')} className="btn-premium">
                <Plus className="h-5 w-5" />
                Novo Morador
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-border/50 bg-card focus:border-blue-500/50 focus:ring-blue-500/20"
          />
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="todos" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="todos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
              Todos ({moradores.length})
            </TabsTrigger>
            <TabsTrigger value="aprovados" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
              Aprovados ({moradores.filter(m => m.status === 'aprovado' && !m.isBlocked).length})
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
              <UserCheck className="h-4 w-4 mr-1.5 text-amber-600" />
              Pendentes ({moradores.filter(m => m.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="bloqueados" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
              <Ban className="h-4 w-4 mr-1.5 text-red-600" />
              Bloqueados ({moradores.filter(m => m.isBlocked).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos">
            <MoradoresList 
              moradores={filteredMoradores}
              onEdit={(id) => setLocation(`/moradores/${id}`)}
              onBlock={(id) => setBlockDialog({ open: true, moradorId: id })}
              onUnblock={(id) => desbloquearMutation.mutate({ id })}
              onDelete={(id) => deleteMutation.mutate({ id })}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="aprovados">
            <MoradoresList 
              moradores={filteredMoradores.filter(m => m.status === 'aprovado' && !m.isBlocked)}
              onEdit={(id) => setLocation(`/moradores/${id}`)}
              onBlock={(id) => setBlockDialog({ open: true, moradorId: id })}
              onUnblock={(id) => desbloquearMutation.mutate({ id })}
              onDelete={(id) => deleteMutation.mutate({ id })}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="pendentes">
            <MoradoresList 
              moradores={filteredMoradores.filter(m => m.status === 'pendente')}
              onEdit={(id) => setLocation(`/moradores/${id}`)}
              onBlock={(id) => setBlockDialog({ open: true, moradorId: id })}
              onUnblock={(id) => desbloquearMutation.mutate({ id })}
              onDelete={(id) => deleteMutation.mutate({ id })}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="bloqueados">
            <MoradoresList 
              moradores={filteredMoradores.filter(m => m.isBlocked)}
              onEdit={(id) => setLocation(`/moradores/${id}`)}
              onBlock={(id) => setBlockDialog({ open: true, moradorId: id })}
              onUnblock={(id) => desbloquearMutation.mutate({ id })}
              onDelete={(id) => deleteMutation.mutate({ id })}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        </Tabs>

        {/* Block Dialog */}
        <Dialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog({ open, moradorId: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                Bloquear Morador
              </DialogTitle>
              <DialogDescription>
                Informe o motivo do bloqueio. O morador não poderá fazer reservas enquanto estiver bloqueado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motivo do Bloqueio</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Inadimplência, descumprimento de regras..."
                  className="min-h-[100px] rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setBlockDialog({ open: false, moradorId: null })} className="rounded-xl">
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  if (blockDialog.moradorId && blockReason) {
                    bloquearMutation.mutate({ id: blockDialog.moradorId, motivo: blockReason });
                  }
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                Bloquear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Dialog */}
        <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
                Link de Cadastro
              </DialogTitle>
              <DialogDescription>
                Compartilhe este link com os moradores para que eles possam se cadastrar no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={selectedCondominio?.linkCadastro ? `${window.location.origin}/cadastro/${selectedCondominio.linkCadastro}` : ''}
                  className="rounded-xl bg-muted/50"
                />
                <Button onClick={copyLink} className="rounded-xl gap-2">
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl hover:bg-blue-500/5 hover:border-blue-500/30">
                  <QrCode className="h-6 w-6 text-blue-600" />
                  <span>Gerar QR Code</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl hover:bg-emerald-500/5 hover:border-emerald-500/30">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                  <span>Importar Excel</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface MoradoresListProps {
  moradores: any[];
  onEdit: (id: number) => void;
  onBlock: (id: number) => void;
  onUnblock: (id: number) => void;
  onDelete: (id: number) => void;
  getStatusBadge: (status: string, isBlocked: boolean) => React.ReactNode;
}

function MoradoresList({ moradores, onEdit, onBlock, onUnblock, onDelete, getStatusBadge }: MoradoresListProps) {
  if (moradores.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Users className="h-10 w-10" />
        </div>
        <h3>Nenhum morador encontrado</h3>
        <p>Nenhum morador nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {moradores.map((morador) => (
        <Card 
          key={morador.id} 
          className="premium-card-interactive group"
          onClick={() => onEdit(morador.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-blue-600 font-bold text-lg">
                    {morador.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold group-hover:text-blue-600 transition-colors">{morador.nome}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-0.5">
                    <Home className="h-3.5 w-3.5" />
                    Unidade {morador.unidadeId}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(morador.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {morador.isBlocked ? (
                      <DropdownMenuItem onClick={() => onUnblock(morador.id)} className="text-emerald-600 focus:text-emerald-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbloquear
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onBlock(morador.id)} className="text-destructive focus:text-destructive">
                        <Ban className="h-4 w-4 mr-2" />
                        Bloquear
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(morador.id)} className="text-destructive focus:text-destructive">
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
              {morador.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="truncate">{morador.email}</span>
                </div>
              )}
              {morador.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  {morador.telefone}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-border/50">
              {getStatusBadge(morador.status, morador.isBlocked)}
              {morador.isBlocked && morador.blockReason && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  Motivo: {morador.blockReason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
