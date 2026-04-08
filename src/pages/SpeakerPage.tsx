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
  ArrowRight,
  XCircle,
  Key,
  ThumbsUp,
  Ban,
  Tv,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2,
  Award,
  Star,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { formatDate } from "@/utils/format-data.util";
import { UserRoleEnum, JudgeVoteEnum } from "@/types/enums/api-enums";
import {
  listSpeakerEvents,
  getEventVotesSummary,
} from "@/lib/services/staff.service";
import { Header } from "@/components/ui/header";
import { getCategoryNameMap, getEventStatusMap } from "@/types/enums/enum-maps";
import {
  SpeakerEvent,
  PasswordVoteSummaryResponse,
  SpeakerVoteSummaryResponse,
  RunnerVoteSummaryResponse,
} from "@/types/dtos/staff.dto";

const EventStatsCards = ({ eventStats }: { eventStats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
    {[
      {
        label: "Juízes",
        value: eventStats.activeJudges,
        icon: Users,
        color: "text-primary",
      },
      {
        label: "Corredores",
        value: eventStats.totalRunners,
        icon: Award,
        color: "text-blue-500",
      },
      {
        label: "Senhas",
        value: eventStats.totalPasswords,
        icon: Key,
        color: "text-purple-500",
      },
      {
        label: "Votos Válidos",
        value: eventStats.validVotes,
        icon: ThumbsUp,
        color: "text-green-600",
      },
      {
        label: "Votos Nulos",
        value: eventStats.nullVotes,
        icon: Ban,
        color: "text-yellow-600",
      },
      {
        label: "Pontos Totais",
        value: eventStats.totalPoints,
        icon: Star,
        color: "text-orange-600",
      },
    ].map((stat, index) => (
      <Card key={stat.label} className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const PasswordCard = ({
  password,
  runnerName,
}: {
  password: PasswordVoteSummaryResponse;
  runnerName: string;
}) => {
  const voteStats = useMemo(
    () => getVoteStatsForPassword(password),
    [password]
  );

  return (
    <div className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
      {/* Layout horizontal: Info à esquerda, Votos à direita */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Coluna esquerda: Número da senha e info do corredor */}
        <div className="flex-shrink-0 lg:w-48">
          {/* Número da senha em destaque */}
          <div className="text-center lg:text-left mb-2">
            <span className="text-3xl font-bold text-primary">#{password.passwordNumber}</span>
          </div>
          {/* Info do corredor */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium text-foreground">{runnerName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {getCategoryNameMap(password.categoryName)} • R$ {password.passwordPrice}
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
              {voteStats.total > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    voteStats.result === "VALID"
                      ? "bg-green-100 text-green-800"
                      : voteStats.result === "NULL"
                      ? "bg-yellow-100 text-yellow-800"
                      : voteStats.result === "TV"
                      ? "bg-blue-100 text-blue-800"
                      : voteStats.result === "DID_NOT_RUN"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {voteStats.resultLabel}
                </span>
              )}
              <span className="text-sm font-bold text-primary">{password.passwordPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Coluna direita: Votos dos juízes */}
        <div className="flex-1">
          {voteStats.total > 0 ? (
            <div className="space-y-3">
              {/* Resumo de votos */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ThumbsUp className="h-3 w-3" />
                  <span className="font-medium">{voteStats.valid} Valeu</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                  <Ban className="h-3 w-3" />
                  <span className="font-medium">{voteStats.null} Zero</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Tv className="h-3 w-3" />
                  <span className="font-medium">{voteStats.tv} TV</span>
                </div>
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <SkipForward className="h-3 w-3" />
                  <span className="font-medium">{voteStats.didNotRun} Retorno</span>
                </div>
              </div>

              {/* Votos individuais */}
              <div className="flex flex-wrap gap-2">
                {password.votes.map((vote) => {
                  const voteInfo = getVoteInfo(vote.vote);
                  const VoteIcon = voteInfo.icon;

                  return (
                    <div
                      key={vote.judgeId}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${voteInfo.bgColor}`}
                    >
                      <span className="text-xs truncate max-w-20">{vote.judgeName}:</span>
                      <VoteIcon className={`h-3 w-3 ${voteInfo.color}`} />
                      <span className={`text-xs font-medium ${voteInfo.color}`}>{voteInfo.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center lg:justify-start py-2">
              <p className="text-sm text-muted-foreground">Aguardando votos dos juízes...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RunnerCard = ({
  runner,
  isExpanded,
  onToggle,
}: {
  runner: RunnerVoteSummaryResponse;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <Card
    key={runner.userId}
    className="overflow-hidden hover:shadow-md transition-all"
  >
    <CardHeader
      className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">{runner.runnerName}</CardTitle>
            <CardDescription>
              {runner.runnerCity &&
                `${runner.runnerCity}, ${runner.runnerState} • `}
              {runner.passwords.length} senha(s) • {runner.totalPoints} pontos
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {runner.totalPoints} pts
            </div>
            <div className="text-xs text-muted-foreground">
              {runner.validVotes} válidos
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
          {runner.passwords.map((password) => (
            <PasswordCard key={password.passwordId} password={password} runnerName={runner.runnerName} />
          ))}
        </div>
      </CardContent>
    )}
  </Card>
);

const SearchInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="relative">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    <Input
      placeholder={placeholder}
      className="pl-12 pr-4 py-2 text-base border-2 focus:border-primary/50 transition-all rounded-xl bg-background/50 backdrop-blur-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const getEventStatusColors = (status: string) => {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
  };
  return (
    statusColors[status as keyof typeof statusColors] ||
    "bg-gray-100 text-gray-800"
  );
};

const getVoteInfo = (vote: string) => {
  const voteInfoMap = {
    [JudgeVoteEnum.VALID]: {
      label: "Valeu o Boi",
      color: "text-green-600",
      bgColor: "bg-green-100",
      icon: ThumbsUp,
    },
    [JudgeVoteEnum.NULL]: {
      label: "Zero",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: Ban,
    },
    [JudgeVoteEnum.TV]: {
      label: "TV",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: Tv,
    },
    [JudgeVoteEnum.DID_NOT_RUN]: {
      label: "Retorno",
      color: "text-red-600",
      bgColor: "bg-red-100",
      icon: SkipForward,
    },
  };

  return (
    voteInfoMap[vote as keyof typeof voteInfoMap] || {
      label: "Desconhecido",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: Ban,
    }
  );
};

const getVoteStatsForPassword = (password: PasswordVoteSummaryResponse) => {
  const stats = {
    total: password.votes.length,
    valid: password.votes.filter((v) => v.vote === JudgeVoteEnum.VALID).length,
    null: password.votes.filter((v) => v.vote === JudgeVoteEnum.NULL).length,
    tv: password.votes.filter((v) => v.vote === JudgeVoteEnum.TV).length,
    didNotRun: password.votes.filter(
      (v) => v.vote === JudgeVoteEnum.DID_NOT_RUN
    ).length,
  };

  const { valid, null: nullCount, tv, didNotRun } = stats;

  if (valid > nullCount && valid > tv && valid > didNotRun) {
    return { ...stats, result: "VALID", resultLabel: "Valeu o Boi" };
  } else if (nullCount > valid && nullCount > tv && nullCount > didNotRun) {
    return { ...stats, result: "NULL", resultLabel: "Zero" };
  } else if (tv > valid && tv > nullCount && tv > didNotRun) {
    return { ...stats, result: "TV", resultLabel: "TV" };
  } else if (didNotRun > valid && didNotRun > nullCount && didNotRun > tv) {
    return { ...stats, result: "DID_NOT_RUN", resultLabel: "Retorno" };
  } else {
    return { ...stats, result: "TIE", resultLabel: "Empate" };
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

const SpeakerPage = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<SpeakerEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpeakerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [votesSummary, setVotesSummary] =
    useState<SpeakerVoteSummaryResponse | null>(null);
  const [expandedRunners, setExpandedRunners] = useState<Set<string>>(
    new Set()
  );

  const isSpeaker = user?.role === UserRoleEnum.SPEAKER;

  useEffect(() => {
    async function fetchSpeakerEvents() {
      if (!isSpeaker || !user?.id) return;

      try {
        const response = await listSpeakerEvents(user.id);
        setEvents(response);
      } catch (err) {
        console.error("Erro ao carregar eventos do locutor:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSpeakerEvents();
  }, [isSpeaker, user?.id]);

  const votesSummaryRef = useRef<string>("");

  useEffect(() => {
    if (!selectedEvent || !user?.id) return;

    async function fetchVotesSummary() {
      try {
        const summary = await getEventVotesSummary(selectedEvent!.id);
        const sortedSummary = {
          ...summary,
          runners: summary.runners
            .map((runner) => ({
              ...runner,
              passwords: [...runner.passwords].sort(
                (a, b) => Number(a.passwordNumber) - Number(b.passwordNumber)
              ),
            }))
            .sort((a, b) => a.runnerName.localeCompare(b.runnerName)),
        };

        const serialized = JSON.stringify(sortedSummary);
        if (serialized !== votesSummaryRef.current) {
          votesSummaryRef.current = serialized;
          setVotesSummary(sortedSummary);
        }
      } catch (err) {
        console.error("Erro ao carregar resumo de votos:", err);
        setVotesSummary(null);
      }
    }

    fetchVotesSummary();
    const intervalId = setInterval(fetchVotesSummary, 10000);
    return () => clearInterval(intervalId);
  }, [selectedEvent, user?.id]);

  const handleEventSelect = useCallback((event: SpeakerEvent) => {
    setSelectedEvent(event);
    setSearchTerm("");
    setExpandedRunners(new Set());
    setVotesSummary(null);
    votesSummaryRef.current = "";
  }, []);

  const toggleRunnerExpansion = useCallback((runnerId: string) => {
    setExpandedRunners((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(runnerId)) {
        newSet.delete(runnerId);
      } else {
        newSet.add(runnerId);
      }
      return newSet;
    });
  }, []);

  const toggleAllRunners = useCallback(
    (expand: boolean) => {
      if (!votesSummary) return;

      if (expand) {
        const allRunnerIds = votesSummary.runners.map((r) => r.userId);
        setExpandedRunners(new Set(allRunnerIds));
      } else {
        setExpandedRunners(new Set());
      }
    },
    [votesSummary]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const locationInfo = getLocationInfo(event.location);
      const searchLower = searchTerm.toLowerCase();

      return (
        event.name.toLowerCase().includes(searchLower) ||
        locationInfo.city.toLowerCase().includes(searchLower) ||
        locationInfo.state.toLowerCase().includes(searchLower)
      );
    });
  }, [events, searchTerm]);

  const filteredRunners = useMemo(() => {
    if (!votesSummary) return [];

    const allRunners = votesSummary.runners;

    if (!searchTerm) return allRunners;

    const searchLower = searchTerm.toLowerCase();
    return allRunners
      .map((runner) => ({
        ...runner,
        passwords: runner.passwords.filter(
          (password) =>
            password.passwordNumber.toString().includes(searchTerm) ||
            runner.runnerName.toLowerCase().includes(searchLower) ||
            password.categoryName.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((runner) => runner.passwords.length > 0)
      .map((runner) => ({
        ...runner,
        passwords: [...runner.passwords].sort(
          (a, b) => Number(a.passwordNumber) - Number(b.passwordNumber)
        ),
      }));
  }, [votesSummary, searchTerm]);

  const eventStats = useMemo(() => {
    if (!votesSummary) return null;

    const totalRunners = votesSummary.runners.length;
    const totalPasswords = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.passwords.length,
      0
    );
    const totalValidVotes = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.validVotes,
      0
    );
    const totalNullVotes = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.nullVotes,
      0
    );
    const totalTvVotes = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.tvVotes,
      0
    );
    const totalDidNotRunVotes = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.didNotRunVotes,
      0
    );
    const totalPoints = votesSummary.runners.reduce(
      (sum, runner) => sum + runner.totalPoints,
      0
    );

    const allJudges = new Set();
    votesSummary.runners.forEach((runner) => {
      runner.passwords.forEach((password) => {
        password.votes.forEach((vote) => {
          allJudges.add(vote.judgeId);
        });
      });
    });

    return {
      activeJudges: allJudges.size,
      validVotes: totalValidVotes,
      nullVotes: totalNullVotes,
      tvVotes: totalTvVotes,
      didNotRunVotes: totalDidNotRunVotes,
      totalRunners,
      totalPasswords,
      totalPoints,
    };
  }, [votesSummary]);

  const backButton = selectedEvent ? (
    <Button
      variant="outline"
      onClick={() => setSelectedEvent(null)}
      className="flex items-center gap-2"
    >
      <ArrowRight className="h-4 w-4 rotate-180" />
      Voltar
    </Button>
  ) : null;

  if (!isSpeaker) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-center">
              Esta área é exclusiva para locutores.
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
        user={user || { name: "Locutor", role: UserRoleEnum.SPEAKER }}
        onLogout={logout}
        isAuthenticated={true}
        title="Área do Locutor"
        customActions={backButton}
      />

      <main className="container mx-auto px-4 py-8">
        {!selectedEvent ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Meus Eventos como Locutor
              </h1>
              <p className="text-lg text-muted-foreground">
                Selecione um evento para acompanhar os votos dos juízes
              </p>
            </div>

            <div className="max-w-xl mx-auto mb-8">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar eventos por cidade ou nome..."
              />
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
                            <Volume2 className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="h-5 w-5 text-primary" />
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
                          <span>Ver Votações</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Volume2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? `Não encontramos resultados para "${searchTerm}"`
                    : "Você não está designado como locutor em nenhum evento no momento"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {selectedEvent.name}
                </h1>
                <p className="text-muted-foreground">
                  Acompanhamento de votos -{" "}
                  {getLocationInfo(selectedEvent.location).city}
                  {getLocationInfo(selectedEvent.location).state &&
                    `, ${getLocationInfo(selectedEvent.location).state}`}
                </p>
                {selectedEvent.cattlePerPassword && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                      <Award className="h-4 w-4" />
                      {selectedEvent.cattlePerPassword} boi(s) por senha
                    </span>
                  </div>
                )}
              </div>
            </div>

            {eventStats && <EventStatsCards eventStats={eventStats} />}

            <div className="flex justify-between items-center mb-6">
              <div className="max-w-xl flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por corredor, senha ou categoria..."
                />
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

            {!votesSummary ? (
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Carregando dados de votação...
                </p>
              </div>
            ) : filteredRunners.length > 0 ? (
              <div className="space-y-4">
                {filteredRunners.map((runner) => (
                  <RunnerCard
                    key={runner.userId}
                    runner={runner}
                    isExpanded={expandedRunners.has(runner.userId)}
                    onToggle={() => toggleRunnerExpansion(runner.userId)}
                  />
                ))}
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
                      : "Não há corredores com senhas neste evento"}
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

export default SpeakerPage;
