# AI Providers Monitor

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Ferramenta profissional de observabilidade e diagnóstico para provedores de IA.  
Possui um **Dashboard Web** elegante para validação em massa (Bulk Checker) de chaves, permitindo verificar conectividade, saldo, uso de rate limits e modelos disponíveis.

## Provedores Suportados

| Provedor | Prefixo da Key | Status Report (Métricas extraídas) |
|----------|---------------|----------------|
| **OpenRouter** | `sk-or-v1-...` | Saldo (dólares), Status (Exhausted/Free), Rate Limits e Lista de Modelos. |
| **OpenAI** | `sk-proj-...` ou `sk-...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |
| **xAI (Grok)** | `xai-...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |
| **Groq** | `gsk_...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |
| **Anthropic** | `sk-ant-api03-...` | Validação Autenticada e Lista de Modelos Compatíveis. |
| **Google Gemini** | `AIzaSy...` | Validação de Modelos via Google AI Studio. |

A arquitetura é extensível — novos provedores podem ser adicionados no backend (`src/api.js`).

## Funcionalidades Principais

- **Dashboard Moderno**: Interface Web (React/Vite) inspirada no design da Vercel (dark mode, minimalist).
- **Drag & Drop Bulk Checker**: Arraste arquivos `.txt` contendo dezenas de chaves e veja o resultado de validação de todas em tempo real.
- **Detecção Inteligente (Anti Falso-Positivo)**: Regex avançada reconhece chaves com segurança.
- **Server-Sent Events (SSE)**: Feedback visual instantâneo do progresso de carregamento e validação assíncrona das chaves na tabela.
- **Categorização Real de Status**:
  - 🟢 **Online**: Chave válida e com saldo.
  - 🟡 **Exhausted**: Chave válida, mas com limite de gastos estourado.
  - 🔵 **Free Tier**: Chave válida, atrelada a conta gratuita.
  - 🟣 **Unknown Limits**: Chave válida, porém não fornece dados de quota.
  - 🔴 **Offline**: Chave revogada/inexistente.
- **Rate Limits & Usage**: Exibe o consumo atual em dólar, limite de requisições por minuto e tokens restantes.
- **Lista de Modelos Expansível**: Clicando na linha de cada provedor, veja a lista de todos os modelos (ex: `gpt-4o`, `llama-3`) a que aquela chave tem acesso.

## Requisitos

- Node.js 20+ ou 22+

## Instalação

```bash
git clone https://github.com/muriloatavares/ai-provider-monitor.git
cd ai-provider-monitor
npm install
cd dashboard
npm install
cd ..
```

## Configuração e Inicialização

O sistema foi redesenhado para não depender obrigatoriamente de chaves no arquivo `.env` para rodar o Dashboard. 

### 1. Iniciar o Backend (Proxy/Validator)
Abra um terminal na pasta raiz e execute:
```bash
npm run dev
```
*(O servidor rodará na porta 3000)*

### 2. Iniciar o Dashboard (Frontend)
Abra um **segundo terminal**, entre na pasta `dashboard` e inicie o Vite:
```bash
cd dashboard
npm run dev
```
*(O frontend rodará na porta 5173)*

### 3. Acessar
Abra seu navegador em `http://localhost:5173/`. 
Arraste e solte um arquivo `.txt` contendo as chaves na área indicada. As chaves serão validadas simultaneamente!

---

## Estrutura do Projeto (Arquitetura Local-First)

```
/
├── src/
│   ├── api.js                # Servidor Backend (Express) focado apenas em roteamento
│   ├── index.js              # Inicializador principal (CLI e orquestrador)
│   ├── providers/            # Conectores para LLMs (OpenRouter, Groq, xAI...)
│   ├── services/             # Lógica de negócio (keyValidator, pricingEngine, etc)
│   ├── utils/                # Utilitários (logger, formatter, keyDetector)
│   ├── constants/            # Mapeamentos padronizados
│   └── config/env.js         # Validação de variáveis de ambiente
├── dashboard/                # Frontend React + Vite
│   ├── src/
│   │   ├── contexts/         # Context API (ThemeContext para Dark Mode)
│   │   ├── hooks/            # Hooks de lógica e state (useKeyChecker)
│   │   ├── pages/            # Páginas principais (Dashboard agregador)
│   │   ├── components/       # Componentes modulares (DropZone, KeyRow, ResultsTable)
│   │   ├── layouts/          # Estruturas base (MainLayout com Navbar)
│   │   ├── App.jsx           # Roteamento Frontend
│   │   └── index.css         # Estilos globais
│   ├── tailwind.config.js
│   └── vite.config.js        # Config c/ Proxy para /api
├── package.json              # Dependências do Backend
├── deploy.bat                # Pipeline de Deploy Automatizado CI/CD
└── README.md
```

## Pipeline de Automação (deploy.bat)

O repositório possui um utilitário nativo de Deploy projetado para agilizar a vida do desenvolvedor. Executando o arquivo `deploy.bat`, ele automatiza o fluxo inteiro do Git com qualidade Enterprise:
1. **Auto-Format**: Roda `Prettier` em todo o código instantaneamente.
2. **Conventional Commits**: Pergunta através de um menu (feat, fix, docs, config) e formata a tag do commit com escopo.
3. **Semantic Versioning**: Permite fazer *Bump* (Patch, Minor, Major) alterando o seu `package.json` sozinho.
4. **Segurança Integrada**: Tem suporte dinâmico de branch atual e rollback automático (`git reset --soft`) se o envio falhar.

## Como o Bulk Checker funciona?

Você só precisa ter um ou mais arquivos de texto (`.txt`) com várias linhas misturadas contendo chaves, textos aleatórios, lixo etc.
Quando você joga o arquivo na tela:
1. O React (via `useKeyChecker`) lê o texto e envia para a API.
2. A rota `/api/check-keys-stream` aciona o utilitário `keyDetector` para filtrar apenas as chaves válidas usando regex.
3. Requisições em streaming via Server-Sent Events (SSE) batem nos endpoints de cada provedor pelo serviço `keyValidator`.
4. O resultado volta incrementalmente em tempo real para o frontend, construindo a tabela visualmente sem travar a UI!

## Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais informações e termos de uso.
