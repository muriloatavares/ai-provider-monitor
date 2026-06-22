# AI Providers Monitor

Ferramenta profissional de observabilidade e diagnóstico para provedores de IA.  
Valida conectividade, autenticação, saldo, modelos disponíveis e performance de múltiplos provedores em uma única execução.

## Provedores Suportados

| Provedor | Prefixo da Key | Endpoint |
|----------|---------------|----------|
| OpenRouter | `sk-or-v1-...` | `openrouter.ai/api/v1` |
| xAI (Grok) | `xai-...` | `api.x.ai/v1` |
| Groq | `gsk_...` | `api.groq.com/openai/v1` |

A arquitetura é extensível — novos provedores (OpenAI, Anthropic, Gemini, etc.) podem ser adicionados criando uma classe que estende `BaseProvider`.

## Funcionalidades

- **Health Check** — Validação de API Key, autenticação e disponibilidade
- **Balance Check** — Consulta de saldo, uso acumulado e limites (quando disponível)
- **Benchmark** — Testes de latência com prompts Light e Medium (5 rodadas cada)
- **Token Tracking** — Contagem total de tokens (prompt + completion) por sessão
- **Health Score** — Nota de 0 a 100 baseada em auth, disponibilidade e taxa de sucesso
- **Bulk Checker** — Validação em massa de chaves a partir de arquivo `.txt`
- **Model Listing** — Lista todos os modelos disponíveis para uma chave
- **Uptime Monitor** — Monitoramento contínuo de disponibilidade com cálculo de % de uptime
- **API Express** — Endpoints REST para integração com dashboards
- **Exportação JSON** — Relatórios com histórico temporal

## Requisitos

- Node.js 22+

## Instalação

```bash
git clone <repo>
cd Checker
npm install
```

## Configuração

Copie o template de variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves. **Não é obrigatório preencher todas** — a aplicação roda com pelo menos uma chave configurada:

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
OPENROUTER_MODEL=openrouter/auto

# xAI (Grok)
XAI_API_KEY=xai-sua-chave-aqui
XAI_MODEL=grok-beta

# Groq
GROQ_API_KEY=gsk_sua-chave-aqui
GROQ_MODEL=llama-3.3-70b-versatile

# Geral
TIMEOUT_MS=15000
PORT=3000
UPTIME_INTERVAL_MS=60000    # Intervalo de monitoramento (padrão: 60s)
```

## Comandos

### Diagnóstico Completo

Executa health check, balance, benchmark, token tracking e exporta relatórios:

```bash
npm start
```

Exemplo de saída:

```
==================================================
AI PROVIDERS STATUS REPORT
==================================================

GROQ
ℹ Status: ONLINE
ℹ API Key: VALID
ℹ Average Latency: 380 ms
ℹ Balance/Credits: NOT AVAILABLE
ℹ Health Score: 100/100
ℹ Success Rate: 100%

==================================================
BENCHMARK
==================================================
🏆 1º Groq - Latência Média: 380 ms

==================================================
TOKEN USAGE
==================================================

GROQ
ℹ API Calls:          10
ℹ Prompt Tokens:      120
ℹ Completion Tokens:  280
ℹ Total Tokens:       400
ℹ Estimated Cost:     $0.0000

GRAND TOTAL (SESSION)
ℹ Total API Calls:        10
ℹ Total Tokens Used:      400
```

### Bulk Checker (Validação em Massa)

Crie um arquivo `.txt` com uma chave por linha (linhas com `#` são ignoradas):

```txt
# Chaves OpenRouter
sk-or-v1-chave1
sk-or-v1-chave2

# Chaves Groq
gsk_chave1
gsk_chave2
```

Execute passando o caminho do arquivo:

```bash
npm run bulk -- "keys openrouter.txt"
npm run bulk -- "keys grok.txt"
npm run bulk                          # usa keys.txt por padrão
```

Exemplo de saída:

```
==================================================
BULK KEY CHECKER - Found 13 keys
==================================================
✔ VALID: sk-or-v1...7d2d | Provider: openrouter | Models: 339 | $0.0000 used (no limit set)
✔ VALID: sk-or-v1...502c | Provider: openrouter | Models: 339 | $1.0721 remaining (used $2.93 of $4.00)
✖ INVALID: gsk_d4KX...wuzM | Provider: groq | Error: HTTP 401

==================================================
BULK SUMMARY
==================================================
✔ Valid: 11
✖ Invalid: 3
```

### Listar Modelos Disponíveis

Passe uma chave direto ou um arquivo:

```bash
npm run models -- gsk_sua-chave-aqui
npm run models -- "keys grok.txt"
```

Exemplo de saída:

```
==================================================
MODEL LISTING
==================================================
✔ 17 models available:

  📦 groq/compound              | ctx: 131,072
  📦 llama-3.3-70b-versatile    | ctx: 131,072
  📦 meta-llama/llama-4-scout   | ctx: 131,072
  📦 qwen/qwen3-32b             | ctx: 131,072
  📦 whisper-large-v3-turbo     | ctx: 448
```

### Uptime Monitor (Disponibilidade)

Monitora a disponibilidade de cada provedor e calcula a porcentagem de uptime ao longo do tempo.

```bash
# Check único — pinga uma vez e mostra dashboard
npm run uptime:once

# Ver status acumulado — sem pingar de novo
npm run uptime:status

# Monitoramento contínuo — pinga a cada 60s (Ctrl+C para parar)
npm run uptime
```

Exemplo de saída:

```
==================================================
UPTIME DASHBOARD
==================================================

GROQ
ℹ Uptime (all time): [████████████████████] 100.00%
ℹ Uptime (1h):       100.00%
ℹ Uptime (24h):      98.50%
ℹ Total Checks:      120 (✔ 118 | ✖ 2)
ℹ Avg Latency:       380 ms
ℹ Monitoring Since:  2026-06-22T14:00:00.000Z
ℹ Last Check:        2026-06-22T16:00:00.000Z

OPENROUTER
ℹ Uptime (all time): [███████████████████░] 97.50%
ℹ Total Checks:      80 (✔ 78 | ✖ 2)
ℹ Avg Latency:       420 ms
```

O intervalo de monitoramento pode ser configurado via `.env`:

```env
UPTIME_INTERVAL_MS=30000   # A cada 30 segundos
```

O histórico é persistido em `reports/uptime.json` e sobrevive a reinicializações.

## API Express

A API é iniciada automaticamente junto com o `npm start` na porta configurada no `.env`.

### Endpoints

#### `GET /health`

```json
{
  "status": "healthy",
  "uptime": 12.35,
  "timestamp": "2026-06-22T14:30:00.000Z"
}
```

#### `GET /providers`

```json
{
  "openrouter": { "online": true },
  "xai": { "online": false },
  "groq": { "online": true }
}
```

#### `GET /benchmark`

Retorna o JSON completo do benchmark com métricas de latência, TTFB e tokens.

## Relatórios Exportados

Todos os relatórios são salvos automaticamente em `reports/`:

```
reports/
├── latest.json             # Último diagnóstico completo
├── benchmark.json          # Último benchmark
├── bulk_report.json        # Última validação em massa
├── models_report.json      # Última listagem de modelos
├── uptime.json             # Histórico de disponibilidade
└── history/
    ├── 2026-06-22T14-30-00.json
    └── 2026-06-22T15-00-00.json
```

## Estrutura do Projeto

```
src/
├── providers/
│   ├── BaseProvider.js         # Classe base (axios, retry, métricas)
│   ├── OpenRouterProvider.js   # OpenRouter
│   ├── XaiProvider.js          # xAI (Grok)
│   ├── GroqProvider.js         # Groq
│   └── index.js                # Registry de providers
├── services/
│   ├── healthCheck.js          # Orquestrador de health check
│   ├── balanceCheck.js         # Orquestrador de balance
│   └── benchmark.js            # Benchmark (Light + Medium)
├── utils/
│   ├── logger.js               # Logs coloridos (chalk)
│   ├── formatter.js            # Formatação de moeda e tempo
│   ├── timer.js                # Medição de performance
│   ├── exporter.js             # Exportação JSON + histórico
│   └── tokenTracker.js         # Acumulador global de tokens
├── config/
│   └── env.js                  # Validação de variáveis de ambiente
├── api.js                      # Servidor Express
├── index.js                    # Entry point (diagnóstico completo)
├── bulk.js                     # Validação em massa
├── models.js                   # Listagem de modelos
└── uptime.js                   # Monitor de disponibilidade
```

## Tratamento de Erros

| Código HTTP | Comportamento |
|-------------|--------------|
| 429 (Rate Limit) | Retry com backoff exponencial |
| 500, 502, 503, 504 | Retry com backoff exponencial |
| 401 (Unauthorized) | Fail fast — chave inválida |
| 403 (Forbidden) | Fail fast — sem permissão |
| 400, 404 | Fail fast — requisição inválida |

## Segurança

- Chaves são **sempre mascaradas** nos logs e relatórios
- Nenhuma chave é armazenada em texto plano nos JSONs exportados pelo bulk
- Validação obrigatória de variáveis de ambiente na inicialização
- Nenhum segredo hardcoded no código

## Extensão (Adicionar Novo Provedor)

1. Crie `src/providers/NovoProvider.js` estendendo `BaseProvider`
2. Implemente `checkAuth()`, `generate()` e `getBalance()`
3. Registre no `src/providers/index.js`
4. Adicione a variável de ambiente em `src/config/env.js`
5. Atualize o `providerKeyMap` em `src/index.js`

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Missing required environment variables` | Configure pelo menos uma chave no `.env` |
| `HTTP 401` | Chave inválida ou expirada |
| `HTTP 429` | Rate limit atingido — o retry automático lida com isso |
| `ECONNREFUSED` | Endpoint do provedor está fora do ar |
| `TIMEOUT` | Aumente o `TIMEOUT_MS` no `.env` |
| Modelos não aparecem | Verifique se a chave tem permissão de acesso |

## Tutorial Passo a Passo

### Pré-requisitos

Certifique-se de ter o Node.js 22+ instalado:

```bash
node --version
# v22.x.x ou superior
```

---

### Passo 1 — Instalar Dependências

```bash
cd C:\Users\Murilo\Documents\Projetos\Checker
npm install
```

Esse comando instala axios, chalk, express, dotenv e axios-retry.

---

### Passo 2 — Criar o Arquivo .env

O `npm start` (diagnóstico completo) precisa de um arquivo `.env` na raiz do projeto.

**No PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Ou manualmente:** crie o arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Preencha APENAS os provedores que você usa.
# Não precisa preencher todos — o sistema roda com pelo menos 1.

# OpenRouter (chaves começam com sk-or-v1-)
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
OPENROUTER_MODEL=openrouter/auto

# xAI / Grok (chaves começam com xai-)
XAI_API_KEY=xai-sua-chave-aqui
XAI_MODEL=grok-beta

# Groq (chaves começam com gsk_)
GROQ_API_KEY=gsk_sua-chave-aqui
GROQ_MODEL=llama-3.3-70b-versatile

# Configurações gerais
TIMEOUT_MS=15000
PORT=3000
UPTIME_INTERVAL_MS=60000
```

> **Importante:** Se você só tem chaves Groq, preencha apenas `GROQ_API_KEY` e `GROQ_MODEL`. Deixe as outras linhas comentadas ou remova-as.

**Exemplo com apenas Groq:**

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
TIMEOUT_MS=15000
PORT=3000
```

---

### Passo 3 — Diagnóstico Completo

Após criar o `.env`, rode:

```bash
npm start
```

Isso vai executar automaticamente:

1. ✅ Health Check (auth + disponibilidade)
2. 💰 Balance Check (saldo e uso)
3. 🏁 Benchmark (5 testes Light + 5 testes Medium)
4. 📊 Token Tracking (contagem de tokens usados)
5. 📁 Exportação (salva JSONs em `reports/`)
6. 🌐 API Express (inicia servidor HTTP em background)

---

### Passo 4 — Validação em Massa de Chaves

Esse comando **NÃO precisa de `.env`**. Ele lê as chaves diretamente do arquivo `.txt`:

```bash
# Testar chaves Groq
npm run bulk -- "keys grok.txt"

# Testar chaves OpenRouter
npm run bulk -- "keys openrouter.txt"

# Testar arquivo padrão (keys.txt)
npm run bulk
```

O sistema auto-detecta o provedor pelo prefixo da chave:

| Prefixo | Provedor |
|---------|----------|
| `sk-or-v1-` | OpenRouter |
| `xai-` | xAI (Grok) |
| `gsk_` | Groq |

---

### Passo 5 — Listar Modelos de uma Chave

Também **NÃO precisa de `.env`**. Passe a chave diretamente:

```bash
# Com uma chave direto
npm run models -- gsk_sua-chave-aqui

# Ou com um arquivo (usa a primeira chave válida de cada provedor)
npm run models -- "keys grok.txt"
```

---

### Passo 6 — Monitorar Uptime

**Precisa de `.env`** (usa as chaves configuradas):

```bash
# Check único — pinga uma vez e mostra resultado
npm run uptime:once

# Ver dashboard com dados acumulados (sem pingar)
npm run uptime:status

# Monitoramento contínuo (Ctrl+C para parar)
npm run uptime
```

---

### Passo 7 — Testar a API Express

Enquanto o `npm start` estiver rodando, abra outro terminal:

```bash
# Status do servidor
curl http://localhost:3000/health

# Status dos provedores
curl http://localhost:3000/providers

# Resultado do benchmark
curl http://localhost:3000/benchmark
```

Ou acesse diretamente no navegador: `http://localhost:3000/health`

---

### Passo 8 — Verificar Relatórios

Após qualquer execução, confira a pasta `reports/`:

```bash
dir reports
```

Você encontrará os JSONs gerados automaticamente.

---

### Resumo Rápido de Comandos

| Comando | O que faz | Precisa de .env? |
|---------|-----------|:----------------:|
| `npm start` | Diagnóstico completo + API Express | ✅ Sim |
| `npm run bulk -- "arquivo.txt"` | Valida chaves em massa | ❌ Não |
| `npm run models -- <chave>` | Lista modelos disponíveis | ❌ Não |
| `npm run uptime:once` | Check de disponibilidade | ✅ Sim |
| `npm run uptime:status` | Dashboard de uptime | ✅ Sim |
| `npm run uptime` | Monitoramento contínuo | ✅ Sim |

---

### Erros Comuns

**"No API keys configured"**
→ Você não criou o `.env` ou as chaves estão vazias. Veja o Passo 2.

**"File not found: keys.txt"**
→ Passe o caminho correto do arquivo: `npm run bulk -- "keys grok.txt"`

**"HTTP 401"**
→ A chave é inválida ou foi revogada.

**"HTTP 429"**
→ Rate limit atingido. O retry automático tenta novamente com backoff.

**O npm start não lê meu arquivo .txt de chaves**
→ O `npm start` lê **apenas o `.env`**, não arquivos `.txt`. Para testar chaves de um arquivo, use `npm run bulk`.

## Licença

MIT
