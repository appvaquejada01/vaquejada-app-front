import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoleEnum } from "@/types/enums/api-enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageCircle,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const FaleConosco = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Aqui você deve integrar com seu serviço de envio de email
      // Por exemplo: API do backend, SendGrid, EmailJS, etc.

      // Simulação de envio (substitua pela chamada real da API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Exemplo de como seria com uma API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!response.ok) throw new Error('Erro ao enviar mensagem');

      setSubmitSuccess(true);
      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });

      // Limpar formulário
      setFormData({
        name: "",
        email: "",
        whatsapp: "",
        subject: "",
        message: "",
      });

      // Resetar estado de sucesso após 5 segundos
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header
        user={user || { name: "Usuário", role: UserRoleEnum.USER }}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        title="Vaquejada APP"
      />

      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/20"></div>
        <div className="absolute top-10 left-10 w-56 h-56 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FALE CONOSCO
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Tire suas dúvidas, faça suas sugestões ou reclamações. Estamos
              aqui para ajudar!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Mail className="h-6 w-6 text-primary" />
                    Envie sua mensagem
                  </CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e retornaremos o mais breve
                    possível
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {submitSuccess ? (
                    <div className="py-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Mensagem Enviada!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Recebemos sua mensagem e entraremos em contato em breve.
                      </p>
                      <Button
                        onClick={() => setSubmitSuccess(false)}
                        variant="outline"
                      >
                        Enviar outra mensagem
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Seu nome completo"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="border-2 focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="border-2 focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={formData.whatsapp}
                          onChange={handleInputChange}
                          className="border-2 focus:border-primary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Opcional - para contato mais rápido
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="flex items-center gap-2">
                          Assunto <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.subject}
                          onValueChange={handleSubjectChange}
                          required
                        >
                          <SelectTrigger className="border-2 focus:border-primary/50">
                            <SelectValue placeholder="Selecione o assunto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="duvidas">Dúvidas</SelectItem>
                            <SelectItem value="sugestoes">Sugestões</SelectItem>
                            <SelectItem value="reclamacoes">
                              Reclamações
                            </SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center gap-2">
                          Mensagem <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Escreva sua mensagem aqui..."
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="border-2 focus:border-primary/50 resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          Mínimo 10 caracteres
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        <span className="text-red-500">*</span> Campos
                        obrigatórios
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Outras formas de contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Email
                      </p>
                      <a
                        href="mailto:contato@vaquejadaapp.com"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        contato@vaquejadaapp.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        WhatsApp
                      </p>
                      <a
                        href="https://wa.me/5511999999999"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        (11) 99999-9999
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Telefone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (11) 3333-3333
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Perguntas Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Antes de enviar sua mensagem, confira se sua dúvida já foi
                    respondida em nossa seção de perguntas frequentes.
                  </p>
                </CardContent>
              </Card>

              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-green-900">
                      Tempo de resposta
                    </p>
                    <p className="text-xs text-green-700">
                      Respondemos em até 24 horas úteis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FaleConosco;
