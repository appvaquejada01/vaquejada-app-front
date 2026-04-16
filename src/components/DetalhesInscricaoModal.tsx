import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  User,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Shield,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetSubscriptionResponse, ListSubscriptionResponse } from "@/types/api";
import {
  getCategoryNameMap,
  getSubscriptionStatusMap,
} from "@/types/enums/enum-maps";
import {
  formatCPF,
  formatDate,
  formatPhone,
  formatPrice,
} from "@/utils/format-data.util";
import { PasswordStatusEnum, SubscriptionStatusEnum } from "@/types/enums/api-enums";

interface DetalhesInscricaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscricao: ListSubscriptionResponse | null;
  onSubscriptionUpdated?: () => void;
}

export const DetalhesInscricaoModal = ({
  open,
  onOpenChange,
  inscricao,
  onSubscriptionUpdated,
}: DetalhesInscricaoModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!inscricao) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case SubscriptionStatusEnum.CONFIRMED:
        return "default";
      case SubscriptionStatusEnum.PENDING:
        return "secondary";
      case SubscriptionStatusEnum.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case SubscriptionStatusEnum.CONFIRMED:
        return <CheckCircle className="h-4 w-4" />;
      case SubscriptionStatusEnum.PENDING:
        return <Clock className="h-4 w-4" />;
      case SubscriptionStatusEnum.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: SubscriptionStatusEnum) => {
    if (!inscricao?.id) return;

    setLoading(true);
    try {
      toast({
        title: "Status atualizado!",
        description: `Inscrição ${getSubscriptionStatusMap(
          newStatus
        ).toLowerCase()} com sucesso.`,
      });

      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status da inscrição.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runner = inscricao.runner?.name || "Nome não informado";
  const runnerInitials = runner
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-2 rounded-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Detalhes da Inscrição
          </DialogTitle>
          <DialogDescription className="text-base">
            Informações completas do competidor e inscrição
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/10">
                <AvatarFallback className="text-lg font-bold bg-yellow-400 text-yellow-900">
                  {runnerInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {runner}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(inscricao.status)}
                  <Badge
                    variant={getStatusVariant(inscricao.status)}
                    className="text-sm font-medium"
                  >
                    {getSubscriptionStatusMap(inscricao.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações de Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inscricao.runner.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium text-foreground">
                      {inscricao.runner.email}
                    </p>
                  </div>
                </div>
              )}

              {inscricao.runner.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium text-foreground">
                      {formatPhone(inscricao.runner.phone) || "Não informado"}
                    </p>
                  </div>
                </div>
              )}

              {inscricao.runner.cpf && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium text-foreground">
                      {formatCPF(inscricao.runner.cpf)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Informações do Evento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Evento</p>
                  <p className="font-medium text-foreground">
                    {inscricao.event?.name || "Evento não especificado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium text-foreground">
                    {getCategoryNameMap(inscricao.category.name)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data da inscrição
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(inscricao.subscribedAt)}
                  </p>
                </div>
              </div>

              {inscricao.passwords && inscricao.passwords.length > 0 ? (
                <div className="col-span-2 bg-muted/30 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Senhas compradas
                  </h5>
                  <div className="flex flex-wrap gap-3">
                    {inscricao.passwords.map((senha, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="px-4 py-2 text-base font-bold rounded-lg shadow-sm border border-primary/20 bg-primary/10 text-primary"
                      >
                        {senha.number}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Data da inscrição
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(inscricao.subscribedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {(() => {
            const totalPago = inscricao.passwords?.reduce(
              (sum, p) => sum + Number(p.price),
              0
            ) ?? 0;
            const senhaPaga = inscricao.passwords?.find((p) => p.soldAt);
            const dataPagamento = senhaPaga?.soldAt
              ? formatDate(senhaPaga.soldAt)
              : null;
            const statusSenhas = inscricao.passwords?.every(
              (p) => p.status === PasswordStatusEnum.RESERVED || p.status === PasswordStatusEnum.USED
            )
              ? "Confirmado"
              : inscricao.passwords?.some(
                  (p) => p.status === PasswordStatusEnum.RESERVED || p.status === PasswordStatusEnum.USED
                )
              ? "Parcialmente confirmado"
              : "Pendente";

            return (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Informações de Pagamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      Valor total ({inscricao.passwords?.length ?? 0} senha
                      {(inscricao.passwords?.length ?? 0) !== 1 ? "s" : ""})
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(totalPago)}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">
                      Status do pagamento
                    </p>
                    <p className="font-medium text-foreground">{statusSenhas}</p>
                  </div>

                  {dataPagamento && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Data do pagamento
                        </p>
                        <p className="font-medium text-foreground">
                          {dataPagamento}
                        </p>
                      </div>
                    </div>
                  )}

                  {inscricao.passwords && inscricao.passwords.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Valor por senha
                        </p>
                        <p className="font-medium text-foreground">
                          {formatPrice(Number(inscricao.passwords[0].price))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              ID: {inscricao.id || "N/A"}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
