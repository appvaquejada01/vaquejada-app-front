import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/ui/header";
import { UserRoleEnum } from "@/types/enums/api-enums";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowRight,
  Ticket,
  Mail,
  Download,
  Home,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useRef } from "react";

const CheckoutSuccess = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const webhookTriggered = useRef(false);

  // Parâmetros do Mercado Pago
  const paymentData = {
    collectionId: searchParams.get("collection_id"),
    collectionStatus: searchParams.get("collection_status"),
    paymentId: searchParams.get("payment_id"),
    status: searchParams.get("status"),
    externalReference: searchParams.get("external_reference"),
    paymentType: searchParams.get("payment_type"),
    merchantOrderId: searchParams.get("merchant_order_id"),
    preferenceId: searchParams.get("preference_id"),
  };

  useEffect(() => {
    const triggerWebhook = async () => {
      if (webhookTriggered.current) return;
      webhookTriggered.current = true;

      try {
        if (!paymentData.paymentId) {
          setIsProcessing(false);
          return;
        }

        const payload = {
          action: "payment.created",
          api_version: "v1",
          data: {
            id: paymentData.paymentId,
          },
          date_created: new Date().toISOString(),
          id: Number(paymentData.paymentId),
          live_mode: true,
          type: "payment",
          user_id: "2939523178",
        };

        await fetch("https://vaquejada-app.onrender.com/webhooks/mp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      } catch (error) {
        console.error("Erro ao acionar webhook:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    if (paymentData.status === "approved") {
      triggerWebhook();
    } else {
      setIsProcessing(false);
    }
  }, [paymentData.paymentId, paymentData.status]);

  const getPaymentTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      bank_transfer: "Transferência Bancária",
      ticket: "Boleto",
      pix: "PIX",
    };
    return type ? types[type] || type : "Não informado";
  };

  // Se o pagamento não foi aprovado, mostrar erro
  if (paymentData.status !== "approved") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header
          user={user || { name: "Usuário", role: UserRoleEnum.USER }}
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          title="Vaquejada APP"
        />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-foreground">
              Pagamento Não Aprovado
            </h1>
            <p className="text-muted-foreground mb-8">
              Houve um problema com seu pagamento. Por favor, tente novamente.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
              <Button onClick={() => navigate("/meus-ingressos")}>
                Ver Meus Ingressos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header
        user={user || { name: "Usuário", role: UserRoleEnum.USER }}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        title="Vaquejada APP"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {isProcessing ? (
            <Card className="border-2 shadow-xl">
              <CardContent className="py-16">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
                  <h2 className="text-2xl font-bold mb-2 text-foreground">
                    Processando seu pagamento...
                  </h2>
                  <p className="text-muted-foreground">
                    Aguarde enquanto confirmamos sua compra
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="mb-8">
                  <img
                    src={logo}
                    alt="Vaquejada APP Logo"
                    className="w-32 h-32 mx-auto object-contain"
                  />
                </div>

                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Pagamento Aprovado!
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Sua inscrição foi confirmada com sucesso. Em breve você
                  receberá um e-mail com todos os detalhes.
                </p>
              </div>

              <Card className="border-2 shadow-xl mb-6">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CreditCard className="h-5 w-5" />
                    Detalhes do Pagamento
                  </CardTitle>
                  <CardDescription>
                    Informações sobre sua transação
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          ID da Transação
                        </p>
                        <p className="font-mono text-sm font-medium text-foreground">
                          {paymentData.paymentId}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Forma de Pagamento
                        </p>
                        <p className="font-medium text-foreground">
                          {getPaymentTypeLabel(paymentData.paymentType)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Status
                        </p>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovado
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {paymentData.externalReference && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Referência do Pedido
                          </p>
                          <p className="font-mono text-xs font-medium text-foreground break-all">
                            {paymentData.externalReference}
                          </p>
                        </div>
                      )}

                      {paymentData.merchantOrderId && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            ID do Pedido
                          </p>
                          <p className="font-mono text-sm font-medium text-foreground">
                            {paymentData.merchantOrderId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Próximos Passos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">
                          Verifique seu e-mail
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enviamos um e-mail de confirmação com todos os
                          detalhes da sua inscrição e instruções para o evento.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">
                          Acesse seus ingressos
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Seus ingressos já estão disponíveis na área "Meus
                          Ingressos". Você pode visualizar e baixar quando
                          quiser.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">
                          Prepare-se para o evento
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fique atento às informações do evento e chegue com
                          antecedência. Nos vemos lá!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Voltar ao Início
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to="/meus-ingressos">
                    <Ticket className="h-4 w-4 mr-2" />
                    Meus Ingressos
                  </Link>
                </Button>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  asChild
                >
                  <Link to="/vaquejadas">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Mais Eventos
                  </Link>
                </Button>
              </div>

              <div className="mt-8 text-center p-6 bg-muted/30 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-2">
                  Precisa de ajuda ou não recebeu o e-mail?
                </p>
                <Link
                  to="/fale-conosco"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Entre em contato conosco
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default CheckoutSuccess;
