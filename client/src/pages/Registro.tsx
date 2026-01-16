import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Lock, Mail, User, Phone, Loader2, Building2, ArrowRight, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

export default function Registro() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"administradora" | "sindico" | "morador">("morador");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Conta criada com sucesso! Bem-vindo, ${data.user.name}!`);
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    registerMutation.mutate({ name, email, password, phone: phone || undefined, role });
  };

  // Validação de força da senha
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Fraca", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "Média", color: "bg-yellow-500" };
    return { strength, label: "Forte", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Reservas</span>
          </div>
          <p className="text-white/80 text-sm">Sistema de Gestão de Reservas</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Crie sua conta gratuita
            </h1>
            <p className="text-white/80 text-lg">
              Comece a gerenciar as reservas do seu condomínio em minutos.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Gestão completa de áreas comuns</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Calendário de reservas em tempo real</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Relatórios e estatísticas detalhadas</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CheckCircle className="h-5 w-5 text-white" />
              <span>Notificações automáticas</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 Sistema de Reservas. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">Reservas</span>
          </div>

          <Card className="border-0 shadow-2xl shadow-slate-200/50">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
              <CardDescription className="text-center">
                Preencha os dados para criar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Tipo de Conta *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)} disabled={registerMutation.isPending}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20">
                      <SelectValue placeholder="Selecione o tipo de conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morador">Morador</SelectItem>
                      <SelectItem value="sindico">Síndico</SelectItem>
                      <SelectItem value="administradora">Administradora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              i <= passwordStrength.strength ? passwordStrength.color : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Força da senha: <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar Conta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
                    Entrar
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-center text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos{" "}
                  <a href="#" className="text-teal-600 hover:underline">Termos de Uso</a>
                  {" "}e{" "}
                  <a href="#" className="text-teal-600 hover:underline">Política de Privacidade</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
