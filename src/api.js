/**
 * @file api.js
 * @description Servidor Express que expõe a API REST do AI Providers Monitor.
 *
 * Responsabilidades:
 * - Definir rotas e middleware HTTP
 * - Delegar processamento para serviços especializados
 * - Servir dados dos relatórios JSON gerados pelo backend CLI
 *
 * Este arquivo NÃO contém lógica de negócio. Toda validação de chaves,
 * detecção de providers e mapeamento de erros estão nos módulos dedicados.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import config from "./config/env.js";
import { extractKeys } from "./utils/keyDetector.js";
import { validateKey } from "./services/keyValidator.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const REPORTS_DIR = path.resolve("reports");

/**
 * Lê e parseia um arquivo JSON do diretório de relatórios.
 * Retorna null silenciosamente se o arquivo não existir ou estiver corrompido,
 * pois os relatórios são gerados sob demanda e podem não existir ainda.
 *
 * @param {string} filename - Nome do arquivo dentro de reports/.
 * @returns {object|null} Dados parseados ou null.
 */
const safeReadJSON = (filename) => {
  try {
    const file = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    // Arquivo corrompido ou inacessível — retorna null para não quebrar a API
  }
  return null;
};

// ─── Endpoints de leitura de relatórios ──────────────────────────────

app.get("/api/dashboard/summary", (req, res) => {
  const latest = safeReadJSON("latest.json");
  const tokenTracker = latest?.tokenUsage?.grandTotal || {};
  const costs = safeReadJSON("costs.json");

  res.json({
    onlineProviders: Object.keys(latest?.providers || {}).filter(
      (k) => latest.providers[k].status === "online",
    ).length,
    monitoredProviders: Object.keys(latest?.providers || {}).length,
    totalTokens: tokenTracker.totalTokens || 0,
    totalCost: costs?.grandTotalCost || 0,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/providers", (req, res) => {
  const latest = safeReadJSON("latest.json");
  res.json(latest?.providers || {});
});

app.get("/api/models", (req, res) => {
  const ranking = safeReadJSON("model_ranking.json");
  res.json(ranking || []);
});

app.get("/api/rankings", (req, res) => {
  const ranking = safeReadJSON("model_ranking.json");
  res.json(ranking || []);
});

app.get("/api/costs", (req, res) => {
  const costs = safeReadJSON("costs.json");
  res.json(costs || {});
});

app.get("/api/history", (req, res) => {
  const stream = safeReadJSON("streaming_benchmark.json");
  res.json(stream || {});
});

app.get("/api/router", (req, res) => {
  const router = safeReadJSON("router_recommendations.json");
  res.json(router || {});
});

app.get("/api/free-models", (req, res) => {
  const freeModels = safeReadJSON("free_models.json");
  res.json(freeModels || {});
});

app.get("/api/provider-analytics", (req, res) => {
  const history = safeReadJSON("providers_history.json");
  res.json(history || {});
});

// ─── Endpoints de validação de chaves ────────────────────────────────

app.post("/api/check-keys", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const uniqueKeys = extractKeys(text);
  const results = await Promise.all(uniqueKeys.map(validateKey));

  res.json({ checked: results.length, results });
});

/**
 * Endpoint de validação com streaming via Server-Sent Events.
 * Envia resultados incrementalmente conforme cada chave é validada,
 * permitindo que o frontend exiba progresso em tempo real.
 */
app.post("/api/check-keys-stream", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).end();
    return;
  }

  const uniqueKeys = extractKeys(text);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(
    `event: init\ndata: ${JSON.stringify({ total: uniqueKeys.length })}\n\n`,
  );

  if (uniqueKeys.length === 0) {
    res.write(`event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`);
    res.end();
    return;
  }

  const concurrency = 10;
  const queue = [...uniqueKeys];

  const workers = Array(concurrency)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        const result = await validateKey(item);
        res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);
      }
    });

  await Promise.all(workers);

  res.write(`event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`);
  res.end();
});

// ─── Compatibilidade ─────────────────────────────────────────────────

export const updateApiState = (health, benchmark) => {
  // Mantido para compatibilidade reversa com index.js
};

/**
 * Inicia o servidor Express na porta configurada.
 */
export const startApi = () => {
  app.listen(config.PORT, "127.0.0.1", () => {
    console.log(`API Server running on http://127.0.0.1:${config.PORT}`);
  });
};
