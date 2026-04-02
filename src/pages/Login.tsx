import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ArrowLeft, LogIn, Eye, EyeOff, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, senha);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Credenciais inválidas"
      );
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (type: "user" | "corredor" | "admin") => {
    switch (type) {
      case "user":
        setEmail("usuario@email.com");
        setSenha("123456");
        break;
      case "corredor":
        setEmail("corredor@email.com");
        setSenha("123456");
        break;
      case "admin":
        setEmail("admin@parque.com");
        setSenha("admin123");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para eventos
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-sm"></div>
              <Users className="h-10 w-10 text-primary relative z-10" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Vaquejada APP
            </h1>
          </div>

          <p className="text-muted-foreground text-lg">
            Entre na sua conta e continue sua jornada
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-2 shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="text-base">
                Entre na sua conta do Vaquejada APP
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-2 focus:border-primary/50 transition-all bg-background/50 py-3"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="rounded-xl border-2 focus:border-primary/50 transition-all bg-background/50 py-3 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                className="w-full rounded-xl py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 group"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
                    Entrar na Conta
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Novo por aqui?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                className="w-full rounded-xl border-2 hover:border-primary/50"
                asChild
              >
                <Link
                  to="/cadastro"
                  className="flex items-center gap-2 font-medium"
                >
                  Criar Nova Conta
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Participe de eventos
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Acesso seguro</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <LogIn className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Login rápido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
