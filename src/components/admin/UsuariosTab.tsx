import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Eye, Loader2, Search, Shield } from "lucide-react";
import { GetUserResponse } from "@/types/api";
import React, { useState } from "react";
import { getRoleMap } from "@/types/enums/enum-maps";
import { UserRoleEnum } from "@/types/enums/api-enums";
import { CriarUsuarioModal } from "../CriarUsuarioModal";
import { DetalhesUsuarioModal } from "../DetalhesUsuarioModal";

interface UsuariosTabProps {
  usuarios: GetUserResponse[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filtro: string;
  onFiltroChange: (value: string) => void;
  filtroRole: string;
  onFiltroRoleChange: (value: string) => void;
  totalUsuarios: number;
  rolesUnicos: string[];
  onRefreshUsuarios: () => void;
}

export const UsuariosTab: React.FC<UsuariosTabProps> = ({
  usuarios,
  loading,
  page,
  totalPages,
  onPageChange,
  filtro,
  onFiltroChange,
  filtroRole,
  onFiltroRoleChange,
  totalUsuarios,
  rolesUnicos,
  onRefreshUsuarios,
}) => {
  const getRoleColor = (role: UserRoleEnum) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "organizer":
        return "bg-blue-500";
      case "runner":
        return "bg-green-500";
      case "user":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<GetUserResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleVerDetalhes = (usuario: GetUserResponse) => {
    setUsuarioSelecionado(usuario);
    setModalOpen(true);
  };

  const handleUsuarioAtualizado = () => {
    if (onRefreshUsuarios) {
      onRefreshUsuarios();
    }
  };

  const handleUsuarioCriado = () => {
    if (onRefreshUsuarios) {
      onRefreshUsuarios();
    }
  };

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Usuários do Sistema
              </CardTitle>
              <CardDescription className="text-base">
                {totalUsuarios}{" "}
                {totalUsuarios === 1
                  ? "usuário encontrado"
                  : "usuários encontrados"}
              </CardDescription>
            </div>
            <CriarUsuarioModal onUsuarioCriado={handleUsuarioCriado} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={filtro}
                onChange={(e) => onFiltroChange(e.target.value)}
                className="pl-10 rounded-xl border-2 focus:border-primary/50 bg-background/50"
              />
            </div>

            <select
              value={filtroRole}
              onChange={(e) => onFiltroRoleChange(e.target.value)}
              className="rounded-xl border-2 focus:border-primary/50 bg-background/50 px-4 py-2"
            >
              <option value="todos">Todos</option>
              {rolesUnicos.map((role) => (
                <option key={role} value={role}>
                  {getRoleMap(role as UserRoleEnum)}
                </option>
              ))}
            </select>

            <div></div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Carregando usuários...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              usuarios.map((usuario, index) => (
                <div
                  key={usuario.id || index}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {usuario.name || "Nome não informado"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {usuario.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getRoleColor(
                          usuario.role
                        )}`}
                      ></div>
                      <span className="text-sm text-muted-foreground">
                        {getRoleMap(usuario.role)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 justify-end mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          usuario.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm text-muted-foreground">
                        {usuario.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerDetalhes(usuario)}
                      className="rounded-xl hover:bg-primary hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
                  className="rounded-xl"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="rounded-xl"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DetalhesUsuarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        usuario={usuarioSelecionado}
        onUsuarioAtualizado={handleUsuarioAtualizado}
      />
    </>
  );
};
