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
import {
  Shield,
  ArrowLeft,
  LogIn,
  Building2,
  LogOut,
  User,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { userLogin } from "@/lib/services/login.service";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await userLogin(email, senha);
      if (!response.access_token) {
        throw new Error("Credenciais inválidas ou acesso negado");
      }
      localStorage.setItem("token", response.access_token);
      toast.success("Login realizado com sucesso!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

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
              <Shield className="h-10 w-10 text-primary relative z-10" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Vaquejada APP
            </h1>
          </div>

          <p className="text-muted-foreground text-lg">
            Painel administrativo para organizadores
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-2 shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500 mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Área do Organizador
              </CardTitle>
              <CardDescription className="text-base">
                Acesso restrito para administradores de parques
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="admin-email" className="text-sm font-medium">
                  E-mail administrativo
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@parque.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-2 focus:border-primary/50 transition-all bg-background/50 py-3"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="rounded-xl border-2 focus:border-primary/50 transition-all bg-background/50 py-3"
                />
              </div>

              <Button
                className="w-full rounded-xl py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all bg-gradient-vaquejada hover:opacity-90 group"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Acessando...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
                    Entrar no Painel
                  </>
                )}
              </Button>
            </form>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-5 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Acesso Restrito
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Esta área é exclusiva para organizadores de eventos cadastrados.
                Se você é um organizador e não possui acesso, entre em contato.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Gerencie seus eventos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Acompanhe inscrições</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Controle financeiro</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Novo organizador?
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
                  to="/admin/cadastro"
                  className="flex items-center gap-2 font-medium"
                >
                  <Building2 className="h-4 w-4" />
                  Solicite o cadastro do seu parque
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda?{" "}
            <a
              href="mailto:support@vaqueifacil.com"
              className="text-primary hover:underline font-medium"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
