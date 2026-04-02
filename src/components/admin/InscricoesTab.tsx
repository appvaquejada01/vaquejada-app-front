import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Eye, Loader2, Filter, Search } from "lucide-react";
import { ListSubscriptionResponse } from "@/types/api";
import React from "react";
import { formatDate, formatPrice } from "@/utils/format-data.util";
import { SubscriptionStatusEnum } from "@/types/enums/api-enums";
import {
  getCategoryNameMap,
  getSubscriptionStatusMap,
} from "@/types/enums/enum-maps";

interface InscricoesTabProps {
  inscricoes: ListSubscriptionResponse[];
  loading: boolean;
  filtroEvento: string;
  filtroCategoria: string;
  filtroStatus: string;
  buscaNome: string;
  onFiltroEventoChange: (value: string) => void;
  onFiltroCategoriaChange: (value: string) => void;
  onFiltroStatusChange: (value: string) => void;
  onBuscaNomeChange: (value: string) => void;
  inscricoesFiltradas: ListSubscriptionResponse[];
  onVerDetalhes: (inscricao: ListSubscriptionResponse) => void;
}

export const InscricoesTab: React.FC<InscricoesTabProps> = ({
  inscricoes,
  loading,
  filtroEvento,
  filtroCategoria,
  filtroStatus,
  buscaNome,
  onFiltroEventoChange,
  onFiltroCategoriaChange,
  onFiltroStatusChange,
  onBuscaNomeChange,
  inscricoesFiltradas,
  onVerDetalhes,
}) => {
  // Obter dados para os selects (usando a lista completa de inscrições)
  const eventosUnicos = [
    ...new Set(inscricoes.map((insc) => insc.event?.id).filter(Boolean)),
  ];

  const categoriasUnicas = [
    ...new Set(inscricoes.map((insc) => insc.category?.name).filter(Boolean)),
  ];

  const categoriasFiltradas = categoriasUnicas.map((cat) => ({
    valor: cat,
    label: getCategoryNameMap(cat),
  }));

  const getStatusColor = (status: SubscriptionStatusEnum) => {
    switch (status) {
      case SubscriptionStatusEnum.CONFIRMED:
        return "bg-green-500";
      case SubscriptionStatusEnum.PENDING:
        return "bg-yellow-500";
      case SubscriptionStatusEnum.CANCELLED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-2">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Inscrições
            </CardTitle>
            <CardDescription className="text-base">
              {inscricoesFiltradas.length}{" "}
              {inscricoesFiltradas.length === 1
                ? "inscrição encontrada"
                : "inscrições encontradas"}
            </CardDescription>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={buscaNome}
              onChange={(e) => onBuscaNomeChange(e.target.value)}
              className="pl-10 rounded-xl border-2 focus:border-primary/50 bg-background/50"
            />
          </div>

          <select
            value={filtroEvento}
            onChange={(e) => onFiltroEventoChange(e.target.value)}
            className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
          >
            <option value="todos">Todos os eventos</option>
            {eventosUnicos.map((eventoId) => {
              const evento = inscricoes.find(
                (e) => e.event?.id === eventoId
              )?.event;
              return (
                <option key={eventoId} value={eventoId}>
                  {evento?.name || `Evento ${eventoId}`}
                </option>
              );
            })}
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => onFiltroCategoriaChange(e.target.value)}
            className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
          >
            <option value="todos">Todas as categorias</option>
            {categoriasFiltradas.map((categoria) => (
              <option key={categoria.valor} value={categoria.valor}>
                {categoria.label}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => onFiltroStatusChange(e.target.value)}
            className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
          >
            <option value="todos">Todos os status</option>
            <option value={SubscriptionStatusEnum.CONFIRMED}>Confirmado</option>
            <option value={SubscriptionStatusEnum.PENDING}>Pendente</option>
            <option value={SubscriptionStatusEnum.CANCELLED}>Cancelado</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Carregando inscrições...</p>
            </div>
          ) : inscricoesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Nenhuma inscrição encontrada
              </p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            inscricoesFiltradas.map((inscricao, index) => (
              <div
                key={inscricao.id || index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {inscricao.runner?.name || "Nome não informado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inscricao.event?.name || "Evento não encontrado"} •{" "}
                      {getCategoryNameMap(inscricao.category?.name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inscrito em {formatDate(inscricao.subscribedAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(
                        inscricao.status
                      )}`}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      {getSubscriptionStatusMap(inscricao.status)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {formatPrice(Number(inscricao.passwordPrice) || 0)}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVerDetalhes(inscricao)}
                    className="mt-2 rounded-xl hover:bg-primary hover:text-white transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
