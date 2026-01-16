import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Lock, Mail, Loader2, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Bem-vindo, ${data.user.name}!`);
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-12 flex-col justify-between relative overflow-hidden">
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
              Gerencie as reservas do seu condomínio
            </h1>
            <p className="text-white/80 text-lg">
              Sistema completo para gestão de áreas comuns, reservas e moradores.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-white/70 text-sm">Personalizável</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">4</div>
              <div className="text-white/70 text-sm">Níveis de Acesso</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 Sistema de Reservas. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">Reservas</span>
          </div>

          <Card className="border-0 shadow-2xl shadow-slate-200/50">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={loginMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    <Link href="/recuperar-senha" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link href="/registro" className="text-teal-600 hover:text-teal-700 font-semibold">
                    Criar conta
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-center text-muted-foreground">
                  Ao entrar, você concorda com nossos{" "}
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
