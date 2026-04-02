# Vaquejada App - Frontend

Interface do sistema de vaquejada. Aqui o vaqueiro encontra eventos, compra senhas e se inscreve. O admin gerencia tudo pelo dashboard — eventos, usuarios, categorias e inscricoes. Juizes e locutores tem suas proprias telas.

## Tecnologias

- **React 18** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilizacao
- **shadcn/ui** como biblioteca de componentes (baseada em Radix UI)
- **React Hook Form** + **Zod** para formularios e validacao
- **TanStack React Query** para gerenciamento de dados do servidor
- **React Router v6** para navegacao
- **Axios** para chamadas HTTP
- **Recharts** para graficos no painel administrativo

## Paginas do sistema

| Area | O que tem |
|---|---|
| **Publica** | Landing page, login, cadastro, listagem de eventos, detalhes do evento |
| **Vaqueiro** | Perfil, compra de senhas, minhas inscricoes |
| **Admin** | Dashboard completo — gerencia usuarios, eventos, categorias e inscricoes |
| **Staff** | Tela de votacao do juiz e tela do locutor |

## Configuracao

1. Instale as dependencias:
```bash
npm install
# ou
yarn
```

2. Crie o arquivo `.env`:

| Variavel | Para que serve |
|---|---|
| `VITE_API_URL` | URL do backend (ex: `http://localhost:3000`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Chave do Google Maps — opcional, usado para localizacao dos eventos |

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O app vai rodar em `http://localhost:8080`.

## Build e preview

```bash
npm run build      # gera o build de producao na pasta dist/
npm run preview    # serve o build localmente para teste
```

## Deploy

Configurado para o **Netlify**. O deploy acontece automaticamente a cada push.
