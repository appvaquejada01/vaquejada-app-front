import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Trophy,
  FileText,
  Users,
  ArrowLeft,
  Loader2,
  Clock,
  UserCheck,
  AlertTriangle,
  ImageOff,
  ExternalLink,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, getEventCategories } from "@/lib/services/event.service";
import {
  EventResponse,
  CategoryResponse,
  EventCategoryResponse,
} from "@/types/api";
import { formatDate, formatPrice } from "@/utils/format-data.util";
import { CategoriasTab } from "@/components/eventos/CategoriasTab";
import { Header } from "@/components/ui/header";
import { UserRoleEnum } from "@/types/enums/api-enums";

const EventoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();

  const [evento, setEvento] = useState<EventResponse | null>(null);
  const [categorias, setCategorias] = useState<EventCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (id) {
      carregarEvento();
    }
  }, [id]);

  useEffect(() => {
    if (evento?.purchaseClosedAt) {
      calculateTimeLeft();

      const countdownTimer = setInterval(() => {
        calculateTimeLeft();
      }, 1000);

      return () => clearInterval(countdownTimer);
    }
  }, [evento?.purchaseClosedAt]);

  const calculateTimeLeft = () => {
    if (!evento?.purchaseClosedAt) return;

    const purchaseClosedAt = new Date(evento.purchaseClosedAt).getTime();
    const now = new Date().getTime();
    const difference = purchaseClosedAt - now;

    if (difference <= 0) {
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
      });
      return;
    }

    setTimeLeft({
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false,
    });
  };

  const carregarEvento = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEventById(id!);
      setEvento(response);
    } catch (err) {
      console.error("Erro ao carregar evento:", err);
      setError("Erro ao carregar informações do evento");
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    if (!id) return;

    try {
      setLoadingCategorias(true);
      const response = await getEventCategories(id);
      setCategorias(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias do evento",
        variant: "destructive",
      });
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "categorias" && id && categorias.length === 0) {
      carregarCategorias();
    }
  };

  const CountdownTimer = () => {
    if (!evento?.purchaseClosedAt) {
      return null;
    }

    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("pt-BR") +
        " " +
        date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    if (timeLeft.expired) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800 text-sm">
              Vendas Encerradas
            </p>
            <p className="text-red-600 text-sm">
              Período de inscrições finalizado
            </p>
          </div>
        </div>
      );
    }

    const TimeUnit = ({ value, label }: { value: number; label: string }) => (
      <div className="text-center flex-1">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg py-2 px-1 mx-0.5">
          <div className="font-bold text-primary text-lg md:text-xl tracking-tight font-mono">
            {value.toString().padStart(2, "0")}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">
          {label}
        </div>
      </div>
    );

    return (
      <div className="text-center">
        <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-3">
          Encerramento das Vendas
        </p>

        <div className="flex items-stretch justify-between gap-0.5 mb-2">
          {timeLeft.days > 0 && (
            <>
              <TimeUnit value={timeLeft.days} label="dias" />
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-0.5 bg-primary/30 rounded-full"></div>
              </div>
            </>
          )}
          <TimeUnit value={timeLeft.hours} label="horas" />
          <div className="flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-primary/30 rounded-full"></div>
          </div>
          <TimeUnit value={timeLeft.minutes} label="min" />
          <div className="flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-primary/30 rounded-full"></div>
          </div>
          <TimeUnit value={timeLeft.seconds} label="seg" />
        </div>

        <p className="text-primary font-semibold text-sm">
          Até {formatDateTime(evento.purchaseClosedAt)}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user || { name: "Usuário", role: UserRoleEnum.USER }}
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          title="Vaquejada APP"
        />

        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                {error || "Evento não encontrado"}
              </p>
              <Button onClick={() => navigate(-1)}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user || { name: "Usuário", role: UserRoleEnum.USER }}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        title="Vaquejada APP"
      />

      <div className="container mx-auto px-4 mt-6 relative z-10">
        <Card className="mb-8 shadow-lg border-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none"></div>

          <CardHeader className="pb-4 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-48 lg:flex-shrink-0">
                <div className="relative h-64 w-full overflow-hidden rounded-lg border-2 bg-muted">
                  {evento.bannerUrl ? (
                    <>
                      <img
                        src={evento.bannerUrl}
                        alt={`Banner do evento ${evento.name}`}
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="text-center">
                          <ImageOff className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                          <p className="text-xs text-primary/60 font-medium">
                            Banner não carregado
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                      <div className="text-center">
                        <ImageOff className="h-12 w-12 text-primary/30 mx-auto mb-2" />
                        <p className="text-xs text-primary/50 font-medium">
                          Sem banner
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        evento.purchaseClosedAt && !timeLeft.expired
                          ? "bg-green-500/90 text-green-50 shadow-lg"
                          : "bg-red-500/90 text-red-50 shadow-lg"
                      }`}
                    >
                      {evento.purchaseClosedAt && !timeLeft.expired
                        ? "Inscrições Abertas"
                        : "Inscrições Encerradas"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl font-bold mb-3 text-foreground leading-tight">
                      {evento.name}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {evento.city && evento.state
                            ? `${evento.city} - ${evento.state}`
                            : evento.address
                            ? evento.address
                            : "Local a definir"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {formatDate(evento.startAt)}
                          {evento.endAt && <> até {formatDate(evento.endAt)}</>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                    <CountdownTimer />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-12">
          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-muted/50 p-2 rounded-2xl mb-6">
                <TabsTrigger
                  value="info"
                  className="flex items-center gap-3 px-5 py-3 text-base rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <FileText className="h-5 w-5" />
                  Informações
                </TabsTrigger>
                <TabsTrigger
                  value="categorias"
                  className="flex items-center gap-3 px-5 py-3 text-base rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Users className="h-5 w-5" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger
                  value="local"
                  className="flex items-center gap-3 px-5 py-3 text-base rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <MapPin className="h-5 w-5" />
                  Local
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-0">
                <Card className="border-2 transition-all duration-200 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-primary" />
                      Sobre o Evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {evento.description ? (
                      <div className="prose prose-gray max-w-none">
                        <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                          {evento.description}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma descrição disponível para este evento.</p>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-lg mb-4 text-foreground">
                        Informações Importantes
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border transition-all duration-200 hover:bg-muted/50">
                          <Trophy className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              Premiação
                            </p>
                            <p className="text-muted-foreground">
                              {evento.prize && Number(evento.prize) > 0
                                ? formatPrice(Number(evento.prize))
                                : "Sem premiação"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border transition-all duration-200 hover:bg-muted/50">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              Data de Início
                            </p>
                            <p className="text-muted-foreground">
                              {formatDate(evento.startAt)}
                            </p>
                          </div>
                        </div>
                        {evento.endAt && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border transition-all duration-200 hover:bg-muted/50">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                Data de Término
                              </p>
                              <p className="text-muted-foreground">
                                {formatDate(evento.endAt)}
                              </p>
                            </div>
                          </div>
                        )}
                        {evento.purchaseClosedAt && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border transition-all duration-200 hover:bg-muted/50">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                Inscrições Até
                              </p>
                              <p className="text-muted-foreground">
                                {formatDate(evento.purchaseClosedAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categorias" className="mt-0">
                <CategoriasTab
                  eventoId={id!}
                  categorias={categorias}
                  loading={loadingCategorias}
                  eventoStatus={evento.status}
                />
              </TabsContent>

              <TabsContent value="local" className="mt-0">
                <Card className="border-2 transition-all duration-200 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-5 w-5 text-primary" />
                      Localização
                    </CardTitle>
                    <CardDescription>
                      Informações sobre o local do evento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evento.address || evento.city ? (
                      <>
                        <div className="aspect-video rounded-xl border overflow-hidden mb-4">
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(
                              [evento.address, evento.city, evento.state]
                                .filter(Boolean)
                                .join(", ")
                            )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Localização do evento no Google Maps"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/30 rounded-xl border">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                Local do Evento
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {[evento.address, evento.city && evento.state ? `${evento.city} - ${evento.state}` : evento.city]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              [evento.address, evento.city, evento.state]
                                .filter(Boolean)
                                .join(", ")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Abrir no Google Maps
                            </Button>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video bg-muted/30 rounded-xl border flex items-center justify-center">
                        <div className="text-center p-6">
                          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">
                            Local a ser definido
                          </h3>
                          <p className="text-muted-foreground">
                            O local será anunciado em breve
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventoDetalhes;
