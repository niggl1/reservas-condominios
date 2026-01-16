import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Mail, Loader2, Building2, ArrowLeft, CheckCircle, KeyRound, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "token" | "success">("email");

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      toast.success("Instruções enviadas para seu email!");
      setStep("token");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setStep("success");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu email");
      return;
    }
    forgotPasswordMutation.mutate({ email });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    resetPasswordMutation.mutate({ token, password: newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">Reservas</span>
        </div>

        <Card className="border-0 shadow-2xl shadow-slate-200/50">
          {step === "email" && (
            <>
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center">Recuperar Senha</CardTitle>
                <CardDescription className="text-center">
                  Digite seu email para receber as instruções de recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestReset} className="space-y-5">
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
                        disabled={forgotPasswordMutation.isPending}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Enviar Instruções
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {step === "token" && (
            <>
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center">Redefinir Senha</CardTitle>
                <CardDescription className="text-center">
                  Digite o código recebido por email e sua nova senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm font-medium">Código de Recuperação</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="token"
                        type="text"
                        placeholder="Cole o código aqui"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                        disabled={resetPasswordMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                        disabled={resetPasswordMutation.isPending}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                        disabled={resetPasswordMutation.isPending}
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">As senhas não coincidem</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      "Redefinir Senha"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setStep("email")} 
                    className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {step === "success" && (
            <>
              <CardHeader className="space-y-1 pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">Senha Redefinida!</CardTitle>
                <CardDescription className="text-center">
                  Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300"
                  >
                    Ir para o Login
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
