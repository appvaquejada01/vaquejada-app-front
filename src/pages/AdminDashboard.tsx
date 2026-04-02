import { UsuariosTab } from "@/components/admin/UsuariosTab";
import { EventosTab } from "@/components/admin/EventosTab";
import { InscricoesTab } from "@/components/admin/InscricoesTab";
import { useState, useEffect } from "react";
import { listEvents } from "@/lib/services/event.service";
import { GetUserResponse, ListSubscriptionResponse } from "@/types/api";
import { ListEventResponse } from "@/types/api";
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
  Shield,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Building2,
  Eye,
  Download,
  LogOut,
  User,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DetalhesInscricaoModal } from "@/components/DetalhesInscricaoModal";
import { listSubscriptions } from "@/lib/services/subscription.service";
import {
  SubscriptionStatusEnum,
  EventStatusEnum,
} from "@/types/enums/api-enums";
import { formatPrice } from "@/utils/format-data.util";
import { getMe } from "@/lib/services/user.service";
import { listUsers } from "@/lib/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/ui/header";

import { UserRoleEnum } from "@/types/enums/api-enums";

const AdminDashboard = () => {
  const [usuarios, setUsuarios] = useState<GetUserResponse[]>([]);
  const [eventos, setEventos] = useState<ListEventResponse[]>([]);
  const [inscricoes, setInscricoes] = useState<ListSubscriptionResponse[]>([]);
  const [usuario, setUsuario] = useState<GetUserResponse | null>(null);

  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [loadingInscricoes, setLoadingInscricoes] = useState(true);
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  const [inscricaoSelecionada, setInscricaoSelecionada] =
    useState<ListSubscriptionResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [usuariosFiltro, setUsuariosFiltro] = useState("");
  const [usuariosFiltroRole, setUsuariosFiltroRole] = useState<string>("todos");
  const [usuariosPage, setUsuariosPage] = useState(1);
  const usuariosPerPage = 10;

  const [eventosFiltro, setEventosFiltro] = useState("");
  const [eventosFiltroStatus, setEventosFiltroStatus] =
    useState<string>("todos");
  const [eventosFiltroCidade, setEventosFiltroCidade] =
    useState<string>("todos");
  const [eventosFiltroEstado, setEventosFiltroEstado] =
    useState<string>("todos");
  const [eventosPage, setEventosPage] = useState(1);
  const eventosPerPage = 10;

  const [filtroEvento, setFiltroEvento] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [buscaNome, setBuscaNome] = useState<string>("");

  const [stats, setStats] = useState({
    totalEventos: 0,
    totalInscricoes: 0,
    receitaTotal: 0,
    checkinsHoje: 0,
  });

  const { user: authUser, logout } = useAuth();

  const currentUser = authUser || usuario;

  useEffect(() => {
    setUsuariosPage(1);
  }, [usuariosFiltro, usuariosFiltroRole]);

  useEffect(() => {
    setEventosPage(1);
  }, [
    eventosFiltro,
    eventosFiltroStatus,
    eventosFiltroCidade,
    eventosFiltroEstado,
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calcularEstatisticas();
  }, [eventos, inscricoes]);

  const fetchData = async () => {
    await Promise.all([
      fetchUsuario(),
      fetchEventos(),
      fetchInscricoes(),
      fetchUsuarios(),
    ]);
  };

  const fetchUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await listUsers();
      setUsuarios(response ?? []);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchUsuario = async () => {
    try {
      setLoadingUsuario(true);
      const response = await getMe();
      setUsuario(response);
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setUsuario(null);
    } finally {
      setLoadingUsuario(false);
    }
  };

  const fetchEventos = async () => {
    try {
      setLoadingEventos(true);
      const response = await listEvents();
      setEventos(response.data ?? []);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setEventos([]);
    } finally {
      setLoadingEventos(false);
    }
  };

  const fetchInscricoes = async () => {
    try {
      setLoadingInscricoes(true);
      const response = await listSubscriptions();
      setInscricoes(response ?? []);
    } catch (err) {
      console.error("Erro ao carregar inscrições:", err);
      setInscricoes([]);
    } finally {
      setLoadingInscricoes(false);
    }
  };

  const calcularEstatisticas = () => {
    const totalEventos = eventos.length;
    const totalInscricoes = inscricoes.length;

    const receitaTotal = inscricoes.reduce((total, inscricao) => {
      return total + (Number(inscricao.passwordPrice) || 0);
    }, 0);

    const hoje = new Date().toDateString();
    const checkinsHoje = inscricoes.filter((inscricao) => {
      const dataInscricao = new Date(inscricao.subscribedAt).toDateString();
      return (
        dataInscricao === hoje &&
        inscricao.status === SubscriptionStatusEnum.CONFIRMED
      );
    }).length;

    setStats({
      totalEventos,
      totalInscricoes,
      receitaTotal,
      checkinsHoje,
    });
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchNomeEmail =
      u.name?.toLowerCase().includes(usuariosFiltro.toLowerCase()) ||
      u.email?.toLowerCase().includes(usuariosFiltro.toLowerCase());

    const matchRole =
      usuariosFiltroRole === "todos" || u.role === usuariosFiltroRole;

    return matchNomeEmail && matchRole;
  });

  const usuariosTotalPages = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / usuariosPerPage)
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    (usuariosPage - 1) * usuariosPerPage,
    usuariosPage * usuariosPerPage
  );

  const rolesUnicos = [...new Set(usuarios.map((u) => u.role).filter(Boolean))];

  const eventosFiltrados = eventos.filter((e) => {
    const matchNome = e.name
      ?.toLowerCase()
      .includes(eventosFiltro.toLowerCase());
    const matchStatus =
      eventosFiltroStatus === "todos" || e.status === eventosFiltroStatus;
    const matchCidade =
      eventosFiltroCidade === "todos" || e.city === eventosFiltroCidade;
    const matchEstado =
      eventosFiltroEstado === "todos" || e.state === eventosFiltroEstado;

    return matchNome && matchStatus && matchCidade && matchEstado;
  });

  const eventosTotalPages = Math.max(
    1,
    Math.ceil(eventosFiltrados.length / eventosPerPage)
  );

  const eventosPaginados = eventosFiltrados.slice(
    (eventosPage - 1) * eventosPerPage,
    eventosPage * eventosPerPage
  );

  const cidadesUnicas = [
    ...new Set(eventos.map((e) => e.city).filter(Boolean)),
  ];
  const estadosUnicos = [
    ...new Set(eventos.map((e) => e.state).filter(Boolean)),
  ];
  const statusUnicos = [
    ...new Set(eventos.map((e) => e.status).filter(Boolean)),
  ];

  const inscricoesFiltradas = inscricoes.filter((inscricao) => {
    const matchEvento =
      filtroEvento === "todos" ||
      (inscricao.event?.id && inscricao.event.id.toString() === filtroEvento);

    const matchCategoria =
      filtroCategoria === "todos" ||
      inscricao.category?.name === filtroCategoria;

    const matchStatus =
      filtroStatus === "todos" || inscricao.status === filtroStatus;

    const matchNome =
      buscaNome === "" ||
      (inscricao.runner?.name &&
        inscricao.runner.name.toLowerCase().includes(buscaNome.toLowerCase()));

    return matchEvento && matchCategoria && matchStatus && matchNome;
  });

  const handleVerDetalhes = (inscricao: ListSubscriptionResponse) => {
    setInscricaoSelecionada(inscricao);
    setModalOpen(true);
  };

  const financeiroPorEvento = eventos.map((evento) => {
    const inscricoesEvento = inscricoes.filter(
      (insc) => insc.event?.id.toString() === evento.id?.toString()
    );

    const receitaBruta = inscricoesEvento.reduce(
      (total, insc) => total + (Number(insc.passwordPrice) || 0),
      0
    );

    return {
      id: evento.id,
      nome: evento.name,
      data: new Date(evento.startAt).toLocaleDateString("pt-BR"),
      inscricoes: inscricoesEvento.length,
      receitaBruta,
      status: evento.status,
    };
  });

  const getEventStatusColor = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.SCHEDULED:
        return "bg-green-500";
      case EventStatusEnum.LIVE:
        return "bg-yellow-500";
      case EventStatusEnum.CANCELLED:
        return "bg-red-500";
      case EventStatusEnum.FINISHED:
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const userData = currentUser
    ? {
        name: currentUser.name || "Administrador",
        role: UserRoleEnum.ADMIN,
        email: currentUser.email,
      }
    : {
        name: "Administrador",
        role: UserRoleEnum.ADMIN,
        email: "",
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <Header
        user={userData}
        onLogout={logout}
        isAuthenticated={true}
        title="Painel do Organizador"
        showUserDropdown={true}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">
                Eventos Ativos
              </CardTitle>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalEventos}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de eventos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">
                Total de Inscrições
              </CardTitle>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalInscricoes}
              </div>
              <p className="text-xs text-muted-foreground">
                Inscrições em todos os eventos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(stats.receitaTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita bruta acumulada
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="eventos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-muted/50 p-1">
            <TabsTrigger
              value="usuarios"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="eventos"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger
              value="inscricoes"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Inscrições
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="mt-6 space-y-6">
            <UsuariosTab
              usuarios={usuariosPaginados}
              loading={loadingUsuarios}
              page={usuariosPage}
              totalPages={usuariosTotalPages}
              onPageChange={setUsuariosPage}
              filtro={usuariosFiltro}
              onFiltroChange={setUsuariosFiltro}
              filtroRole={usuariosFiltroRole}
              onFiltroRoleChange={setUsuariosFiltroRole}
              totalUsuarios={usuariosFiltrados.length}
              rolesUnicos={rolesUnicos}
              onRefreshUsuarios={fetchUsuarios}
            />
          </TabsContent>

          <TabsContent value="eventos" className="mt-6 space-y-6">
            <EventosTab
              eventos={eventosPaginados}
              loading={loadingEventos}
              page={eventosPage}
              totalPages={eventosTotalPages}
              onPageChange={setEventosPage}
              filtro={eventosFiltro}
              onFiltroChange={setEventosFiltro}
              filtroStatus={eventosFiltroStatus}
              onFiltroStatusChange={setEventosFiltroStatus}
              filtroCidade={eventosFiltroCidade}
              onFiltroCidadeChange={setEventosFiltroCidade}
              filtroEstado={eventosFiltroEstado}
              onFiltroEstadoChange={setEventosFiltroEstado}
              totalEventos={eventosFiltrados.length}
              cidadesUnicas={cidadesUnicas}
              estadosUnicos={estadosUnicos}
              statusUnicos={statusUnicos}
              onEventCreated={fetchEventos}
            />
          </TabsContent>

          <TabsContent value="inscricoes" className="mt-6">
            <InscricoesTab
              inscricoes={inscricoes}
              loading={loadingInscricoes}
              filtroEvento={filtroEvento}
              filtroCategoria={filtroCategoria}
              filtroStatus={filtroStatus}
              buscaNome={buscaNome}
              onFiltroEventoChange={setFiltroEvento}
              onFiltroCategoriaChange={setFiltroCategoria}
              onFiltroStatusChange={setFiltroStatus}
              onBuscaNomeChange={setBuscaNome}
              inscricoesFiltradas={inscricoesFiltradas}
              onVerDetalhes={handleVerDetalhes}
            />
          </TabsContent>

          <TabsContent value="financeiro" className="mt-6 space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                Financeiro
              </h2>
              <p className="text-muted-foreground">
                Acompanhe a saúde financeira do seu parque
              </p>
            </div>

            <div className="grid gap-6">
              <Card className="bg-card/80 backdrop-blur-sm border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Resumo Financeiro Geral
                  </CardTitle>
                  <CardDescription>
                    Todos os eventos - Dados em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">
                        Receita bruta
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(stats.receitaTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-vaquejada rounded-lg text-primary-foreground">
                      <span className="font-medium">Receita líquida</span>
                      <span className="text-2xl font-bold">
                        {formatPrice(stats.receitaTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Financeiro por Evento
                  </CardTitle>
                  <CardDescription>
                    Detalhamento de receita por evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financeiroPorEvento.map((evento, i) => (
                      <Card
                        key={evento.id || i}
                        className="border-2 bg-muted/20 hover:border-primary/30 transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {evento.nome}
                              </CardTitle>
                              <CardDescription>
                                {evento.data} • {evento.inscricoes} inscrições
                              </CardDescription>
                            </div>
                            <div
                              className={`w-3 h-3 rounded-full ${getEventStatusColor(
                                evento.status as EventStatusEnum
                              )}`}
                            ></div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-background/50 rounded-lg">
                              <span className="text-muted-foreground">
                                Receita bruta
                              </span>
                              <p className="font-bold text-lg text-foreground">
                                {formatPrice(evento.receitaBruta)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Exportar CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DetalhesInscricaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        inscricao={inscricaoSelecionada}
      />
    </div>
  );
};

export default AdminDashboard;
