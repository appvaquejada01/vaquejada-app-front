import { userLogin } from "@/lib/services/login.service";
import { createUser, getMe } from "@/lib/services/user.service";
import { GetUserResponse } from "@/types/api";
import { UserRoleEnum } from "@/types/enums/api-enums";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: GetUserResponse | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  cadastrar: (dados: {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
    telefone: string;
  }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GetUserResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      getMe()
        .then((userData) => {
          localStorage.setItem("userId", userData.id);
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
        });
    }
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await userLogin(email, senha);
    if (!response.access_token) {
      throw new Error("Token não recebido");
    }
    localStorage.setItem("token", response.access_token);

    const userData = await getMe();

    localStorage.setItem("userId", userData.id);
    setUser(userData);

    toast.success(`Bem-vindo, ${userData.name || userData.email}!`);

    if (userData.role === UserRoleEnum.ADMIN) {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  const cadastrar = async (dados: {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
    telefone: string;
  }) => {
    const response = await createUser(dados);

    if (!response.access_token) {
      throw new Error("Token não recebido após cadastro");
    }
    localStorage.setItem("token", response.access_token);

    const userData: GetUserResponse = await getMe();

    localStorage.setItem("userId", userData.id);
    setUser(userData);
    toast.success("Conta criada com sucesso!");
    navigate("/");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    toast.success("Você saiu da sua conta");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        cadastrar,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
