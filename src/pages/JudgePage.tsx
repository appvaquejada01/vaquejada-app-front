import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  MapPin,
  Search,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Key,
  ThumbsUp,
  Ban,
  Tv,
  SkipForward,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { formatDate } from "@/utils/format-data.util";
import { UserRoleEnum, JudgeVoteEnum } from "@/types/enums/api-enums";
import {
  listJudgeEvents,
  submitJudgeVote,
  updateJudgeVote,
  getJudgeVotesByEvent,
  getEventVotesSummary,
} from "@/lib/services/staff.service";
import {
  SpeakerVoteSummaryResponse,
  RunnerVoteSummaryResponse,
  PasswordVoteSummaryResponse,
  JudgeVoteDetailResponse,
} from "@/types/dtos/staff.dto";
import { JudgeEvent } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { getEventStatusMap } from "@/types/enums/enum-maps";
import { Header } from "@/components/ui/header";

const JudgePage = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<JudgeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<JudgeEvent | null>(null);
  const [voteSummary, setVoteSummary] = useState<SpeakerVoteSummaryResponse | null>(null);
  const [allVotesSummary, setAllVotesSummary] = useState<SpeakerVoteSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittingVote, setSubmittingVote] = useState<string | null>(null);
  const [expandedRunners, setExpandedRunners] = useState<Set<string>>(
    new Set()
  );

  const isJudge = user?.role === UserRoleEnum.JUDGE;

  const getEventStatusColors = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVoteStatusColors = (status: string) => {
    switch (status) {
      case "Válida":
        return "bg-green-100 text-green-800";
      case "Nula":
        return "bg-yellow-100 text-yellow-800";
      case "TV":
        return "bg-blue-100 text-blue-800";
      case "Aguardando novo boi":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    async function fetchJudgeEvents() {
      if (!isJudge || !user?.id) return;

      try {
        const response = await listJudgeEvents(user.id);
        setEvents(response.events || []);
      } catch (err) {
        console.error("Erro ao carregar eventos do juiz:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchJudgeEvents();
  }, [isJudge, user?.id]);

  const voteSummaryRef = useRef<string>("");

  useEffect(() => {
    if (!selectedEvent || !user?.id) return;

    async function fetchVoteSummary() {
      try {
        const summary = await getJudgeVotesByEvent(selectedEvent!.id, user!.id);
        const serialized = JSON.stringify(summary);
        if (serialized !== voteSummaryRef.current) {
          voteSummaryRef.current = serialized;
          setVoteSummary(summary);
        }
      } catch (err) {
        console.error("Erro ao carregar votos existentes:", err);
        setVoteSummary(null);
      }
    }

    fetchVoteSummary();
    const intervalId = setInterval(fetchVoteSummary, 10000);
    return () => clearInterval(intervalId);
  }, [selectedEvent, user?.id]);

  const allVotesSummaryRef = useRef<string>("");

  useEffect(() => {
    if (!selectedEvent) return;

    async function fetchAllVotes() {
      try {
        const summary = await getEventVotesSummary(selectedEvent!.id);
        const serialized = JSON.stringify(summary);
        if (serialized !== allVotesSummaryRef.current) {
          allVotesSummaryRef.current = serialized;
          setAllVotesSummary(summary);
        }
      } catch (err) {
        console.error("Erro ao carregar resumo geral de votos:", err);
      }
    }

    fetchAllVotes();
    const intervalId = setInterval(fetchAllVotes, 10000);
    return () => clearInterval(intervalId);
  }, [selectedEvent]);

  const handleEventSelect = (event: JudgeEvent) => {
    setSelectedEvent(event);
    setVoteSummary(null);
    setAllVotesSummary(null);
    voteSummaryRef.current = "";
    allVotesSummaryRef.current = "";
    setSearchTerm("");
    setExpandedRunners(new Set());
  };

  const handleVote = async (passwordId: string, vote: JudgeVoteEnum) => {
    if (!selectedEvent || !user?.id) return;

    setSubmittingVote(passwordId);

    try {
      await submitJudgeVote({
        judgeId: user.id,
        eventId: selectedEvent.id,
        passwordId,
        vote,
      });

      // Optimistically update voteSummary
      setVoteSummary((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          runners: prev.runners.map((runner) => ({
            ...runner,
            passwords: runner.passwords.map((pw) => {
              if (pw.passwordId !== passwordId) return pw;
              const newVote: JudgeVoteDetailResponse = {
                scoreId: `temp-${Date.now()}`,
                judgeId: user.id,
                judgeName: user.name ?? "",
                vote,
                points: vote === JudgeVoteEnum.VALID ? 10 : 0,
                votedAt: new Date(),
              };
              return {
                ...pw,
                votes: [...pw.votes, newVote],
                passwordStatus: getVoteLabel(vote),
              };
            }),
          })),
        };
        voteSummaryRef.current = JSON.stringify(updated);
        return updated;
      });

      toast({
        title: "Voto registrado com sucesso!",
        description: "Seu voto foi computado.",
        variant: "default",
      });
    } catch (err) {
      console.error("Erro ao enviar voto:", err);
      toast({
        title: "Erro ao enviar voto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmittingVote(null);
    }
  };

  const handleUpdateVote = async (
    scoreId: string,
    passwordId: string,
    newVote: JudgeVoteEnum
  ) => {
    if (!selectedEvent || !user?.id) return;

    setSubmittingVote(passwordId);

    try {
      await updateJudgeVote(scoreId, { vote: newVote });

      setVoteSummary((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          runners: prev.runners.map((runner) => ({
            ...runner,
            passwords: runner.passwords.map((pw) => {
              if (pw.passwordId !== passwordId) return pw;
              return {
                ...pw,
                votes: pw.votes.map((v) =>
                  v.scoreId === scoreId ? { ...v, vote: newVote } : v
                ),
                passwordStatus: getVoteLabel(newVote),
              };
            }),
          })),
        };
        voteSummaryRef.current = JSON.stringify(updated);
        return updated;
      });

      toast({
        title: "Voto atualizado com sucesso!",
        description: "Seu voto foi alterado.",
        variant: "default",
      });
    } catch (err) {
      console.error("Erro ao atualizar voto:", err);
      toast({
        title: "Erro ao atualizar voto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmittingVote(null);
    }
  };

  const getVoteLabel = (vote: string): string => {
    switch (vote) {
      case JudgeVoteEnum.VALID:
        return "Válida";
      case JudgeVoteEnum.NULL:
        return "Nula";
      case JudgeVoteEnum.TV:
        return "TV";
      case JudgeVoteEnum.DID_NOT_RUN:
        return "Aguardando novo boi";
      default:
        return "Sem votos";
    }
  };

  const getLocationInfo = (location: string) => {
    if (!location) return { city: "", state: "" };

    const parts = location.split(",");
    if (parts.length >= 2) {
      const cityStatePart = parts[parts.length - 1].trim();
      const cityStateMatch = cityStatePart.match(/([^-]+)-([A-Z]{2})/);

      if (cityStateMatch) {
        return {
          city: cityStateMatch[1].trim(),
          state: cityStateMatch[2].trim(),
        };
      }
    }

    return { city: location, state: "" };
  };

  const getLastVote = (password: PasswordVoteSummaryResponse): JudgeVoteDetailResponse | null => {
    return password.votes.length > 0 ? password.votes[password.votes.length - 1] : null;
  };

  const needsNewVote = (password: PasswordVoteSummaryResponse): boolean => {
    const last = getLastVote(password);
    return !last || last.vote === JudgeVoteEnum.DID_NOT_RUN;
  };

  const canChangeVote = (existingVote: JudgeVoteDetailResponse | null): boolean => {
    return existingVote?.vote === JudgeVoteEnum.TV;
  };

  const getAllJudgesVotes = (passwordId: string): JudgeVoteDetailResponse[] => {
    if (!allVotesSummary) return [];
    for (const runner of allVotesSummary.runners) {
      const pw = runner.passwords.find((p) => p.passwordId === passwordId);
      if (pw) return pw.votes;
    }
    return [];
  };

  const getVotingStats = () => {
    if (!voteSummary) return { total: 0, voted: 0 };
    const allPasswords = voteSummary.runners.flatMap((r) => r.passwords);
    return {
      total: allPasswords.length,
      voted: allPasswords.filter((p) => !needsNewVote(p)).length,
    };
  };

  const filteredEvents = events.filter((event) => {
    const locationInfo = getLocationInfo(event.location);
    return (
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationInfo.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationInfo.state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getFilteredRunners = (): RunnerVoteSummaryResponse[] => {
    if (!voteSummary) return [];

    if (!searchTerm) return voteSummary.runners;

    const searchLower = searchTerm.toLowerCase();
    return voteSummary.runners
      .map((runner) => ({
        ...runner,
        passwords: runner.passwords.filter(
          (pw) =>
            pw.passwordNumber.toString().includes(searchTerm) ||
            runner.runnerName.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((runner) => runner.passwords.length > 0);
  };

  const filteredRunners = getFilteredRunners();

  const getVoteInfo = (vote: string) => {
    switch (vote) {
      case JudgeVoteEnum.VALID:
        return {
          label: "Valeu o Boi",
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: ThumbsUp,
        };
      case JudgeVoteEnum.NULL:
        return {
          label: "Zero",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          icon: Ban,
        };
      case JudgeVoteEnum.TV:
        return {
          label: "TV",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          icon: Tv,
        };
      case JudgeVoteEnum.DID_NOT_RUN:
        return {
          label: "Retorno",
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: SkipForward,
        };
      default:
        return {
          label: "Desconhecido",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: Ban,
        };
    }
  };

  const toggleRunnerExpansion = (runnerId: string) => {
    setExpandedRunners((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(runnerId)) {
        newSet.delete(runnerId);
      } else {
        newSet.add(runnerId);
      }
      return newSet;
    });
  };

  const toggleAllRunners = (expand: boolean) => {
    if (!voteSummary) return;

    if (expand) {
      setExpandedRunners(new Set(voteSummary.runners.map((r) => r.userId)));
    } else {
      setExpandedRunners(new Set());
    }
  };

  if (!isJudge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-center">
              Esta área é exclusiva para juízes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/">Voltar para Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header
        user={user || { name: "Juiz", role: UserRoleEnum.JUDGE }}
        onLogout={logout}
        isAuthenticated={true}
        title="Área do Juiz"
      />

      <main className="container mx-auto px-4 py-8">
        {!selectedEvent ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Meus Eventos como Juiz
              </h1>
              <p className="text-lg text-muted-foreground">
                Selecione um evento para começar a avaliação das senhas
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos por cidade ou nome..."
                  className="pl-12 pr-4 py-2 text-base border-2 focus:border-primary/50 transition-all rounded-xl bg-background/50 backdrop-blur-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card
                    key={i}
                    className="overflow-hidden border-2 animate-pulse"
                  >
                    <div className="h-48 bg-muted"></div>
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const locationInfo = getLocationInfo(event.location);
                  const runnerCount = event.runners.length;
                  const totalPasswords = event.runners.reduce(
                    (sum, r) =>
                      sum +
                      r.subscriptions.reduce(
                        (s, sub) => s + sub.passwords.length,
                        0
                      ),
                    0
                  );

                  return (
                    <Card
                      key={event.id}
                      className="overflow-hidden border-2 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 group cursor-pointer bg-card/50 backdrop-blur-sm"
                      onClick={() => handleEventSelect(event)}
                    >
                      <div className="relative h-48 overflow-hidden bg-muted">
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt={`Banner do evento ${event.name}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                            <Award className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          {event.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {locationInfo.city && locationInfo.state
                            ? `${locationInfo.city}, ${locationInfo.state}`
                            : event.location || "Localização não informada"}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(event.startAt)} -{" "}
                            {formatDate(event.endAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Users className="h-4 w-4" />
                          <span>{runnerCount} corredores</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Key className="h-4 w-4" />
                          <span>{totalPasswords} senhas para avaliar</span>
                        </div>
                        {event.cattlePerPassword && (
                          <div className="flex items-center gap-2 text-sm text-primary font-medium mt-2">
                            <Award className="h-4 w-4" />
                            <span>{event.cattlePerPassword} boi(s) por senha</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getEventStatusColors(
                              event.status
                            )}`}
                          >
                            {getEventStatusMap(event.status)}
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter>
                        <Button className="w-full group/btn">
                          <span>Avaliar Senhas</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? `Não encontramos resultados para "${searchTerm}"`
                    : "Você não está designado como juiz em nenhum evento no momento"}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Lista de senhas do evento selecionado agrupadas por corredor
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {selectedEvent.name}
                </h1>
                <p className="text-muted-foreground">
                  Avaliação de senhas -{" "}
                  {getLocationInfo(selectedEvent.location).city}
                  {getLocationInfo(selectedEvent.location).state &&
                    `, ${getLocationInfo(selectedEvent.location).state}`}
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total de Corredores
                      </p>
                      <p className="text-2xl font-bold">
                        {filteredRunners.length}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total de Senhas
                      </p>
                      <p className="text-2xl font-bold">
                        {getVotingStats().total}
                      </p>
                    </div>
                    <Key className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avaliadas
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {getVotingStats().voted}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="max-w-xl flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por corredor ou número da senha..."
                    className="pl-12 pr-4 py-2 text-base border-2 focus:border-primary/50 transition-all rounded-xl bg-background/50 backdrop-blur-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllRunners(true)}
                >
                  Expandir Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllRunners(false)}
                >
                  Recolher Todos
                </Button>
              </div>
            </div>

            {!voteSummary ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredRunners.length > 0 ? (
              <div className="space-y-4">
                {filteredRunners.map((runner: RunnerVoteSummaryResponse) => {
                  const isExpanded = expandedRunners.has(runner.userId);
                  const votedCount = runner.passwords.filter(
                    (pw: PasswordVoteSummaryResponse) => !needsNewVote(pw)
                  ).length;

                  return (
                    <Card key={runner.userId} className="overflow-hidden">
                      <CardHeader
                        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleRunnerExpansion(runner.userId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {runner.runnerName}
                              </CardTitle>
                              <CardDescription>
                                {runner.passwords.length} senha(s) -{" "}
                                {votedCount} avaliada(s)
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div
                                className={`text-sm font-medium ${
                                  votedCount === runner.passwords.length
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {votedCount}/{runner.passwords.length}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {runner.passwords.length > 0
                                  ? Math.round(
                                      (votedCount / runner.passwords.length) *
                                        100
                                    )
                                  : 0}
                                % concluído
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-3 mt-4">
                            {runner.passwords.map((password: PasswordVoteSummaryResponse) => {
                              const lastVote = getLastVote(password);
                              const showNewVoteButtons = needsNewVote(password);
                              const canChangeLast = canChangeVote(lastVote);
                              const roundNumber = password.votes.length + (showNewVoteButtons ? 1 : 0);
                              const allJudgesVotes = getAllJudgesVotes(password.passwordId);

                              return (
                                <div
                                  key={password.passwordId}
                                  className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    {/* Coluna esquerda: número da senha */}
                                    <div className="flex-shrink-0 lg:w-48">
                                      <div className="text-center lg:text-left mb-2">
                                        <span className="text-3xl font-bold text-primary">
                                          #{password.passwordNumber}
                                        </span>
                                      </div>
                                      <div className="text-center lg:text-left">
                                        <p className="text-sm font-medium text-foreground">
                                          {runner.runnerName}
                                        </p>
                                        <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${getVoteStatusColors(
                                              password.passwordStatus
                                            )}`}
                                          >
                                            {password.passwordStatus}
                                          </span>
                                          {password.votes.length > 1 && (
                                            <span className="text-xs text-muted-foreground">
                                              {password.votes.length} boi(s)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                      <div className="space-y-2">
                                        {password.votes.map((vote, idx) => {
                                          const info = getVoteInfo(vote.vote);
                                          const Icon = info.icon;
                                          const isLast = idx === password.votes.length - 1;
                                          const editable = isLast && canChangeLast;

                                          return (
                                            <div key={vote.scoreId} className="flex items-center gap-3">
                                              {password.votes.length > 1 && (
                                                <span className="text-xs font-semibold text-muted-foreground w-12">
                                                  Boi {idx + 1}
                                                </span>
                                              )}
                                              <div
                                                className={`flex items-center gap-1 px-3 py-1 rounded-full ${info.bgColor}`}
                                              >
                                                <Icon className={`h-4 w-4 ${info.color}`} />
                                                <span className={`text-sm font-medium ${info.color}`}>
                                                  {info.label}
                                                </span>
                                                {editable && (
                                                  <span className="text-xs text-blue-600 ml-1">(Editável)</span>
                                                )}
                                              </div>
                                              {editable && (
                                                <div className="flex flex-wrap gap-1">
                                                  <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                                                    onClick={() => handleUpdateVote(vote.scoreId, password.passwordId, JudgeVoteEnum.VALID)}
                                                    disabled={submittingVote === password.passwordId}
                                                  >
                                                    <ThumbsUp className="h-3 w-3 mr-1" />Valeu
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 h-7 text-xs"
                                                    onClick={() => handleUpdateVote(vote.scoreId, password.passwordId, JudgeVoteEnum.NULL)}
                                                    disabled={submittingVote === password.passwordId}
                                                  >
                                                    <Ban className="h-3 w-3 mr-1" />Zero
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs"
                                                    onClick={() => handleUpdateVote(vote.scoreId, password.passwordId, JudgeVoteEnum.DID_NOT_RUN)}
                                                    disabled={submittingVote === password.passwordId}
                                                  >
                                                    <SkipForward className="h-3 w-3 mr-1" />Retorno
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}

                                        {showNewVoteButtons && (
                                          <div className="flex items-center gap-3">
                                            {password.votes.length > 0 && (
                                              <span className="text-xs font-semibold text-orange-600 w-12">
                                                Boi {roundNumber}
                                              </span>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                              <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleVote(password.passwordId, JudgeVoteEnum.VALID)}
                                                disabled={submittingVote === password.passwordId}
                                              >
                                                <ThumbsUp className="h-4 w-4 mr-1" />Valeu
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                                onClick={() => handleVote(password.passwordId, JudgeVoteEnum.NULL)}
                                                disabled={submittingVote === password.passwordId}
                                              >
                                                <Ban className="h-4 w-4 mr-1" />Zero
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => handleVote(password.passwordId, JudgeVoteEnum.TV)}
                                                disabled={submittingVote === password.passwordId}
                                              >
                                                <Tv className="h-4 w-4 mr-1" />TV
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleVote(password.passwordId, JudgeVoteEnum.DID_NOT_RUN)}
                                                disabled={submittingVote === password.passwordId}
                                              >
                                                <SkipForward className="h-4 w-4 mr-1" />Retorno
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {allJudgesVotes.length > 0 && (
                                        <div className="border-t pt-2 mt-2">
                                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Votos de todos os juízes
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {allJudgesVotes.map((vote) => {
                                              const info = getVoteInfo(vote.vote);
                                              const Icon = info.icon;
                                              const isMe = vote.judgeId === user?.id;

                                              return (
                                                <div
                                                  key={vote.scoreId}
                                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${info.bgColor} ${isMe ? "ring-2 ring-primary/40" : ""}`}
                                                >
                                                  <span className="text-xs truncate max-w-20">
                                                    {isMe ? "Eu" : vote.judgeName}:
                                                  </span>
                                                  <Icon className={`h-3 w-3 ${info.color}`} />
                                                  <span className={`text-xs font-medium ${info.color}`}>
                                                    {info.label}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Key className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Nenhum corredor encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? `Não encontramos corredores ou senhas para "${searchTerm}"`
                      : "Não há corredores com senhas para avaliar neste evento"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default JudgePage;
