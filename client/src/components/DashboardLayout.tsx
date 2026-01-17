import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, LogOut, PanelLeft, Users, Building2, CalendarDays, 
  MapPin, UserCheck, Settings, CalendarCheck, FileBarChart, ChevronRight,
  Sparkles, Shield, User, Moon, Sun, Key, QrCode, Star
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { InstallPWA, NotificationBell } from "./InstallPWA";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "text-primary" },
  { icon: CalendarDays, label: "Reservas", path: "/reservas", color: "text-emerald-600" },
  { icon: QrCode, label: "Check-in", path: "/checkin", color: "text-teal-600" },
  { icon: Star, label: "Avaliações", path: "/avaliacoes", color: "text-amber-500" },
  { icon: MapPin, label: "Áreas Comuns", path: "/areas", color: "text-violet-600" },
  { icon: Users, label: "Moradores", path: "/moradores", color: "text-blue-600" },
  { icon: Building2, label: "Condomínios", path: "/condominios", color: "text-purple-600" },
  { icon: Key, label: "Chaves", path: "/chaves", color: "text-amber-600" },
  { icon: UserCheck, label: "Aprovações", path: "/aprovacoes", color: "text-yellow-600" },
  { icon: FileBarChart, label: "Relatórios", path: "/relatorios", color: "text-cyan-600" },
  { icon: CalendarCheck, label: "Usuários", path: "/usuarios", color: "text-orange-600" },
  { icon: Settings, label: "Configurações", path: "/configuracoes", color: "text-gray-600" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative glass-card p-10 max-w-md w-full mx-4 animate-scale-in">
          <div className="flex flex-col items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-10 w-10 text-white" />
            </div>
            
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Bem-vindo ao Sistema de Reservas
              </h1>
              <p className="text-muted-foreground">
                Faça login para acessar o painel de gestão de reservas do seu condomínio.
              </p>
            </div>
            
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="btn-premium w-full"
            >
              <Sparkles className="h-5 w-5" />
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      administradora: "Administradora",
      sindico: "Síndico",
      morador: "Morador"
    };
    return labels[role] || role;
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center hover:bg-sidebar-accent rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src="/logo.png" 
                    alt="Reservas" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="font-bold tracking-tight truncate text-gradient">
                    Reservas
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-4">
            <SidebarMenu className="px-3 space-y-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 rounded-xl transition-all duration-200 font-medium ${
                        isActive 
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 shadow-sm" 
                          : "hover:bg-sidebar-accent"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-colors ${isActive ? item.color : "text-muted-foreground"}`}
                      />
                      <span className={isActive ? "text-foreground" : ""}>{item.label}</span>
                      {isActive && !isCollapsed && (
                        <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent transition-all duration-200 w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
                      <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-sidebar rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="px-2 py-2 mb-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(user?.role || '')}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation('/configuracoes')}
                  className="cursor-pointer rounded-lg h-10"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="cursor-pointer rounded-lg h-10"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Modo Escuro</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive rounded-lg h-10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background">
        {isMobile && (
          <div className="flex border-b h-16 items-center justify-between bg-background/95 px-4 backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-xl bg-muted/50" />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${activeMenuItem?.color?.replace('text-', 'bg-') || 'bg-primary'}`} />
                <span className="font-semibold tracking-tight text-foreground">
                  {activeMenuItem?.label ?? "Menu"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <InstallPWA />
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
