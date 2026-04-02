import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  MapPin,
  Shield,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/lib/services/user.service";
import { GetUserResponse } from "@/types/api";
import { UserRoleEnum, UserNatureEnum } from "@/types/enums/api-enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/format-data.util";
import { getNatureMap, getRoleMap } from "@/types/enums/enum-maps";
import { BRstates } from "@/shared/br-states";

interface DetalhesUsuarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: GetUserResponse | null;
  onUsuarioAtualizado?: () => void;
}

export const DetalhesUsuarioModal: React.FC<DetalhesUsuarioModalProps> = ({
  open,
  onOpenChange,
  usuario,
  onUsuarioAtualizado,
}) => {
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    role: UserRoleEnum.USER,
    nature: UserNatureEnum.MALE,
    city: "",
    state: "",
    isActive: true,
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        name: usuario.name || "",
        email: usuario.email || "",
        password: "", // Não preenchemos a senha por segurança
        phone: usuario.phone || "",
        cpf: usuario.cpf || "",
        role: usuario.role || UserRoleEnum.USER,
        nature: usuario.nature || UserNatureEnum.MALE,
        city: usuario.city || "",
        state: usuario.state || "",
        isActive: usuario.isActive ?? true,
      });
    }
  }, [usuario]);

  const handleInputChange = (
    field: string,
    value: string | boolean | UserRoleEnum | UserNatureEnum
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSalvar = async () => {
    if (!usuario) return;

    setLoading(true);

    try {
      if (!formData.name || formData.name.length < 3) {
        toast({
          title: "Nome muito curto",
          description: "O nome deve ter pelo menos 3 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.email || !formData.email.includes("@")) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password ? formData.password : undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        nature: formData.nature,
        city: formData.city || undefined,
        state: formData.state || undefined,
        isActive: formData.isActive,
      };

      if (formData.password && formData.password.length >= 6) {
        userData.password = formData.password;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Chamar a API para atualizar o usuário
      const response = await updateUser(usuario.id, userData);

      if (response) {
        toast({
          title: "Usuário atualizado com sucesso!",
          description: "As alterações foram salvas.",
        });

        setEditando(false);

        if (onUsuarioAtualizado) {
          onUsuarioAtualizado();
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);

      let errorMessage =
        "Ocorreu um erro ao atualizar o usuário. Tente novamente.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao atualizar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEdicao = () => {
    if (usuario) {
      setFormData({
        name: usuario.name || "",
        email: usuario.email || "",
        password: "",
        phone: usuario.phone || "",
        cpf: usuario.cpf || "",
        role: usuario.role || UserRoleEnum.USER,
        nature: usuario.nature || UserNatureEnum.MALE,
        city: usuario.city || "",
        state: usuario.state || "",
        isActive: usuario.isActive ?? true,
      });
    }
    setEditando(false);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
        6
      )}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            {editando ? "Editar Usuário" : "Detalhes do Usuário"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Edite as informações do usuário"
              : "Visualize as informações detalhadas do usuário"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{usuario.name}</h3>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
              </div>
            </div>

            {!editando ? (
              <Button
                onClick={() => setEditando(true)}
                className="rounded-xl flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelarEdicao}
                  className="rounded-xl flex items-center gap-2"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvar}
                  className="rounded-xl flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome Completo
                </Label>
                {editando ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    minLength={3}
                    maxLength={100}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.name || "Não informado"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </Label>
                {editando ? (
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) =>
                      handleInputChange("cpf", formatCPF(e.target.value))
                    }
                    required
                    maxLength={14}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.cpf ? formatCPF(usuario.cpf) : "Não informado"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nature" className="text-sm font-medium">
                  Tipo de Pessoa
                </Label>
                {editando ? (
                  <Select
                    value={formData.nature}
                    onValueChange={(value: UserNatureEnum) =>
                      handleInputChange("nature", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserNatureEnum).map((nature) => (
                        <SelectItem key={nature} value={nature}>
                          {getNatureMap(nature)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.nature === UserNatureEnum.MALE
                      ? "Masculino"
                      : usuario.nature === UserNatureEnum.FEMALE
                      ? "Feminino"
                      : "Outro"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </Label>
                {editando ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange("phone", formatPhone(e.target.value))
                    }
                    maxLength={15}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.phone
                      ? formatPhone(usuario.phone)
                      : "Não informado"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Informações de Acesso
            </h3>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              {editando ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  maxLength={100}
                  className="rounded-xl border-2 focus:border-primary/50"
                />
              ) : (
                <div className="p-2 bg-muted/30 rounded-xl border">
                  {usuario.email}
                </div>
              )}
            </div>

            {editando && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nova Senha (Opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Deixe em branco para manter a senha atual"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    minLength={6}
                    className="rounded-xl border-2 focus:border-primary/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para manter a senha atual. Mínimo 6
                  caracteres.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Localização
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Cidade
                </Label>
                {editando ? (
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    maxLength={100}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.city || "Não informado"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  Estado
                </Label>
                {editando ? (
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRstates.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {usuario.state || "Não informado"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Configurações do Usuário
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Perfil do Usuário
                </Label>
                {editando ? (
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRoleEnum) =>
                      handleInputChange("role", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRoleEnum).map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleMap(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/30 rounded-xl border">
                    {getRoleMap(usuario.role)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Status do Usuário
                </Label>
                {editando ? (
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      handleInputChange("isActive", value === "active")
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl border">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        usuario.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span>{usuario.isActive ? "Ativo" : "Inativo"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
