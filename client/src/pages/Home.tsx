import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, CheckCircle, Clock, Shield, Users, Building2, ArrowRight, Sparkles, Sliders, Receipt, CalendarCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">Reservas</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Sistema de Reservas Premium
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Gestão Inteligente de{" "}
              <span className="text-gradient">Áreas Comuns</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Simplifique a reserva de espaços no seu condomínio. Sistema completo, 
              intuitivo e 100% personalizável para cada necessidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro">
                <Button size="lg" className="gap-2">
                  Começar Agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Funcionalidades Completas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tudo o que você precisa para gerenciar reservas de forma eficiente
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="premium-card-hover p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Áreas Disponíveis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure qualquer tipo de área comum do seu condomínio
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {areas.map((area, index) => (
              <div key={index} className="premium-card p-6 text-center hover:scale-105 transition-transform cursor-pointer">
                <div className="w-20 h-20 mx-auto mb-3">
                  <img src={area.icon} alt={area.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-medium">{area.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para Modernizar seu Condomínio?
            </h2>
            <p className="text-white/80 mb-8">
              Comece a usar o sistema de reservas mais completo do mercado
            </p>
            <Link href="/registro">
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2"
              >
                Criar Conta Gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Reservas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Sistema de Reservas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Sliders,
    title: "Sistema com a maior quantidade de parâmetros da atualidade",
    description: "Precisa de um parâmetro específico? Nós criamos sob medida para você."
  },
  {
    icon: Receipt,
    title: "Integração com emissores de boletos",
    description: "Integração sem nenhum custo adicional para cobrança de reservas de áreas comuns."
  },
  {
    icon: CalendarCheck,
    title: "Facilidade de efetuar sua reserva",
    description: "No calendário só aparecem as datas disponíveis, facilitando sua escolha."
  },
  {
    icon: Shield,
    title: "Controle de Acesso",
    description: "Hierarquia completa: Super Admin, Administradora, Síndico e Morador."
  },
  {
    icon: Clock,
    title: "Limites Personalizáveis",
    description: "Configure limites por horário, dia, semana, mês e ano para cada área."
  },
  {
    icon: Users,
    title: "Gestão de Moradores",
    description: "Cadastro por link, QR Code, manual ou importação em lote via Excel."
  }
];

const areas = [
  { icon: "/icons/piscina.png", name: "Piscina" },
  { icon: "/icons/churrasqueira.png", name: "Churrasqueira" },
  { icon: "/icons/salao-festas.png", name: "Salão de Festas" },
  { icon: "/icons/academia.png", name: "Academia" },
  { icon: "/icons/quadra-esportes.png", name: "Quadra" },
  { icon: "/icons/playground.png", name: "Playground" },
  { icon: "/icons/sala-jogos.png", name: "Sala de Jogos" },
  { icon: "/icons/sauna.png", name: "Sauna" }
];
