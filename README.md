# AI Providers Monitor

Ferramenta profissional de observabilidade e diagnóstico para provedores de IA.  
Possui um **Dashboard Web** elegante para validação em massa (Bulk Checker) de chaves, permitindo verificar conectividade, saldo, uso de rate limits e modelos disponíveis.

## Provedores Suportados

| Provedor | Prefixo da Key | Status Report (Métricas extraídas) |
|----------|---------------|----------------|
| **OpenRouter** | `sk-or-v1-...` | Saldo (dólares), Status (Exhausted/Free), Rate Limits e Lista de Modelos. |
| **OpenAI** | `sk-proj-...` ou `sk-...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |
| **xAI (Grok)** | `xai-...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |
| **Groq** | `gsk_...` | Validação de Chave, Tokens/Requests Limite/Restantes e Lista de Modelos. |

A arquitetura é extensível — novos provedores podem ser adicionados no backend (`src/api.js`).

## Funcionalidades Principais

- **Dashboard Moderno**: Interface Web (React/Vite) inspirada no design da Vercel (dark mode, minimalist).
- **Drag & Drop Bulk Checker**: Arraste arquivos `.txt` contendo dezenas de chaves e veja o resultado de validação de todas em tempo real.
- **Detecção Inteligente (Anti Falso-Positivo)**: Regex avançada reconhece chaves com segurança.
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
git clone <repo>
cd Checker
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

## Estrutura do Projeto

```
/
├── src/
│   ├── api.js                # Servidor Backend (Express) c/ lógica de validação
│   ├── config/env.js         # Configurações globais
│   └── index.js              # Inicializador backend
├── dashboard/                # Frontend React + Vite
│   ├── src/
│   │   ├── pages/Dashboard.jsx      # Tabela principal e Lógica UI
│   │   ├── components/Badges.jsx    # UI components de status
│   │   ├── App.jsx
│   │   └── index.css                # Estilos base Tailwind + scrollbar custom
│   ├── tailwind.config.js
│   └── vite.config.js        # Config c/ Proxy p/ contornar CORS
├── package.json              # Dependências do Backend
└── README.md
```

## Como o Bulk Checker funciona?

Você só precisa ter um ou mais arquivos de texto (`.txt`) com várias linhas misturadas contendo chaves, textos aleatórios, lixo etc.
Quando você joga o arquivo na tela:
1. O React lê o texto e envia para a API.
2. A rota `/api/check-keys` roda as Expressões Regulares de cada provedor filtrando os lixos.
3. Requisições concorrentes (`Promise.all`) batem nos endpoints de validação de cada provedor para coletar Headers (rate limits) e Body (auth / models).
4. O resultado volta sumarizado para o front!

## Licença

MIT
