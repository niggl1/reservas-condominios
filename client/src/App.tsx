import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Condominios from "./pages/Condominios";
import CondominioForm from "./pages/CondominioForm";
import Moradores from "./pages/Moradores";
import MoradorForm from "./pages/MoradorForm";
import AreasComuns from "./pages/AreasComuns";
import AreaForm from "./pages/AreaForm";
import Reservas from "./pages/Reservas";
import NovaReserva from "./pages/NovaReserva";
import MinhasReservas from "./pages/MinhasReservas";
import ReservaDetalhes from "./pages/ReservaDetalhes";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Cadastro from "./pages/Cadastro";
import Aprovacoes from "./pages/Aprovacoes";
import Relatorios from "./pages/Relatorios";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RecuperarSenha from "./pages/RecuperarSenha";
import Chaves from "./pages/Chaves";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Registro} />
      <Route path="/recuperar-senha" component={RecuperarSenha} />
      <Route path="/cadastro/:link" component={Cadastro} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Admin Routes */}
      <Route path="/condominios" component={Condominios} />
      <Route path="/condominios/novo" component={CondominioForm} />
      <Route path="/condominios/:id" component={CondominioForm} />
      
      {/* Moradores Routes */}
      <Route path="/moradores" component={Moradores} />
      <Route path="/moradores/novo" component={MoradorForm} />
      <Route path="/moradores/:id" component={MoradorForm} />
      <Route path="/aprovacoes" component={Aprovacoes} />
      
      {/* Areas Routes */}
      <Route path="/areas" component={AreasComuns} />
      <Route path="/areas/nova" component={AreaForm} />
      <Route path="/areas/:id" component={AreaForm} />
      
      {/* Reservas Routes */}
      <Route path="/reservas" component={Reservas} />
      <Route path="/reservas/nova" component={NovaReserva} />
      <Route path="/reservas/:id" component={ReservaDetalhes} />
      <Route path="/minhas-reservas" component={MinhasReservas} />
      
      {/* Config Routes */}
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/chaves" component={Chaves} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
