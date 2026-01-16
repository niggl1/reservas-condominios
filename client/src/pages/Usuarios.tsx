import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Search, MoreVertical, Shield, Building2, Home as HomeIcon, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Usuarios() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const { data: usuarios = [], refetch } = trpc.users.list.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado");
      refetch();
    }
  });

  const filteredUsuarios = usuarios.filter((u: any) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                       u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <span className="badge-destructive">Super Admin</span>;
      case 'administradora': return <span className="badge-warning">Administradora</span>;
      case 'sindico': return <span className="badge-info">Síndico</span>;
      case 'morador': return <span className="badge-success">Morador</span>;
      default: return <span className="badge-info">{role}</span>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-5 w-5" />;
      case 'administradora': return <Building2 className="h-5 w-5" />;
      case 'sindico': return <HomeIcon className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários e seus níveis de acesso
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="administradora">Administradora</SelectItem>
              <SelectItem value="sindico">Síndico</SelectItem>
              <SelectItem value="morador">Morador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Grid */}
        {filteredUsuarios.length === 0 ? (
          <Card className="premium-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground text-center">
                {search || roleFilter !== "all" ? "Tente ajustar os filtros" : "Nenhum usuário cadastrado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsuarios.map((usuario: any) => (
              <Card key={usuario.id} className="premium-card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getRoleIcon(usuario.role)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{usuario.name || "Sem nome"}</CardTitle>
                        <CardDescription className="text-xs">
                          {usuario.email}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: usuario.id, role: 'super_admin' })}>
                          Definir como Super Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: usuario.id, role: 'administradora' })}>
                          Definir como Administradora
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: usuario.id, role: 'sindico' })}>
                          Definir como Síndico
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: usuario.id, role: 'morador' })}>
                          Definir como Morador
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {getRoleBadge(usuario.role)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(usuario.createdAt), "dd/MM/yyyy")}
                    </span>
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
