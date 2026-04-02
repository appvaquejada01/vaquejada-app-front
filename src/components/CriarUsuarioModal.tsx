import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, MapPin, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFullUser } from "@/lib/services/user.service";
import { UserRoleEnum, UserNatureEnum } from "@/types/enums/api-enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateFullUser } from "@/types/api";
import { BRstates } from "@/shared/br-states";
import { getNatureMap, getRoleMap } from "@/types/enums/enum-maps";

interface CriarUsuarioModalProps {
  onUsuarioCriado?: () => void;
  trigger?: React.ReactNode;
}

export const CriarUsuarioModal = ({
  onUsuarioCriado,
  trigger,
}: CriarUsuarioModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (
    field: string,
    value: string | boolean | UserRoleEnum | UserNatureEnum
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!formData.password || formData.password.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.cpf || formData.cpf.length !== 14) {
        toast({
          title: "CPF inválido",
          description: "O CPF deve ter 11 dígitos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const userData: CreateFullUser = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        cpf: formData.cpf,
        role: formData.role,
        nature: formData.nature,
        city: formData.city || undefined,
        state: formData.state || undefined,
        isActive: formData.isActive,
        organizerId: "",
      };

      const response = await createFullUser(userData);

      if (response) {
        toast({
          title: "Usuário criado com sucesso!",
          description: "O usuário foi criado e está disponível no sistema.",
        });

        setOpen(false);
        resetForm();

        if (onUsuarioCriado) {
          onUsuarioCriado();
        }
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      let errorMessage = "Ocorreu um erro ao criar o usuário. Tente novamente.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Aplica a formatação do CPF
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo usuário no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informações Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    minLength={3}
                    maxLength={100}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium">
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      handleInputChange("cpf", formatCPF(e.target.value))
                    }
                    required
                    maxLength={14}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nature" className="text-sm font-medium">
                    Tipo de Pessoa *
                  </Label>
                  <Select
                    value={formData.nature}
                    onValueChange={(value: UserNatureEnum) =>
                      handleInputChange("nature", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserNatureEnum).map((nature) => (
                        <SelectItem key={nature} value={nature}>
                          {getNatureMap(nature)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone (Opcional)
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange("phone", formatPhone(e.target.value))
                    }
                    maxLength={15}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
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
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  maxLength={100}
                  className="rounded-xl border-2 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
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
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Localização (Opcional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    placeholder="Nome da cidade"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    maxLength={100}
                    className="rounded-xl border-2 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Estado
                  </Label>
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
                    Perfil do Usuário *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRoleEnum) =>
                      handleInputChange("role", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRoleEnum).map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleMap(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Status do Usuário *
                  </Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      handleInputChange("isActive", value === "active")
                    }
                  >
                    <SelectTrigger className="rounded-xl border-2 focus:border-primary/50">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="rounded-xl border-2"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
