/**
 * @file providerTracker.js
 * @description Serviço de rastreamento histórico de performance.
 *
 * Mantém um arquivo JSON persistente com o histórico de latência
 * e taxa de sucesso de cada provider para construção de gráficos
 * analíticos no frontend.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const REPORT_FILE = path.resolve("reports", "providers_history.json");

class ProviderTracker {
  constructor() {
    this.history = [];
    this.stats = {};
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(REPORT_FILE)) {
        const data = JSON.parse(fs.readFileSync(REPORT_FILE, "utf-8"));
        this.history = data.history || [];
      }
    } catch (error) {
      logger.error(`Falha ao ler o histórico de providers: ${error.message}`);
    }
  }

  saveHistory() {
    try {
      const dir = path.dirname(REPORT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        REPORT_FILE,
        JSON.stringify(
          {
            updatedAt: new Date().toISOString(),
            history: this.history,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      logger.error(
        `Falha ao salvar o histórico de providers: ${error.message}`,
      );
    }
  }

  /**
   * Registra detalhes de infraestrutura capturados dos headers
   */
  track(mainProvider, model, latency, ttfb, status, headers = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      mainProvider, // e.g. openrouter
      model: headers["x-openrouter-model"] || model,
      underlyingProvider: headers["x-openrouter-provider"] || mainProvider,
      latency: Math.round(latency),
      ttfb: Math.round(ttfb || 0),
      status,
      requestId: headers["x-request-id"] || null,
      rateLimitLimit: headers["x-ratelimit-limit"] || null,
      rateLimitRemaining: headers["x-ratelimit-remaining"] || null,
      rateLimitReset: headers["x-ratelimit-reset"] || null,
    };

    this.history.push(entry);

    // Keep reasonable limit
    if (this.history.length > 5000) {
      this.history = this.history.slice(-5000);
    }

    this.saveHistory();
  }
}

const providerTracker = new ProviderTracker();

// Allow running directly to view stats: node src/services/providerTracker.js
if (process.argv[1] && process.argv[1].endsWith("providerTracker.js")) {
  providerTracker.loadHistory();
  logger.box("UNDERLYING PROVIDERS RANKING");

  const aggregates = {};

  for (const h of providerTracker.history) {
    if (h.status !== 200) continue;
    const key = h.underlyingProvider;
    if (!aggregates[key]) aggregates[key] = { count: 0, totalLatency: 0 };
    aggregates[key].count++;
    aggregates[key].totalLatency += h.latency;
  }

  const ranking = Object.keys(aggregates)
    .map((k) => ({
      provider: k,
      avgLatency: Math.round(aggregates[k].totalLatency / aggregates[k].count),
      requests: aggregates[k].count,
    }))
    .sort((a, b) => a.avgLatency - b.avgLatency);

  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i];
    logger.header(`${i + 1}º ${r.provider}`);
    logger.info(
      `Average Latency: ${r.avgLatency}ms (from ${r.requests} requests)`,
    );
  }
}

export default providerTracker;
