/**
 * @file index.js
 * @description Ponto de entrada principal do AI Providers Monitor (modo CLI).
 *
 * Fluxo de execução:
 * 1. Valida variáveis de ambiente
 * 2. Atualiza tabela de preços via PricingEngine
 * 3. Inicia o servidor Express em background
 * 4. Executa health checks, balance checks e benchmarks
 * 5. Gera relatório final e exporta para reports/
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { validateEnv } from "./config/env.js";
import config from "./config/env.js";
import logger from "./utils/logger.js";
import { runHealthCheck } from "./services/healthCheck.js";
import { runBalanceCheck } from "./services/balanceCheck.js";
import { runBenchmark } from "./services/benchmark.js";
import { saveLatest, saveBenchmark, saveHistory } from "./utils/exporter.js";
import { formatCurrency, formatMs } from "./utils/formatter.js";
import { startApi, updateApiState } from "./api.js";
import tokenTracker from "./utils/tokenTracker.js";
import { providers } from "./providers/index.js";
import pricingEngine from "./services/pricingEngine.js";
import { PROVIDER_ENV_KEYS } from "./constants/providers.js";

/**
 * Retorna os nomes dos providers que possuem API key configurada no .env.
 *
 * @returns {string[]} Lista de identificadores de providers ativos.
 */
const getActiveProviders = () => {
  return Object.keys(providers).filter((name) => {
    const envKey = PROVIDER_ENV_KEYS[name];
    return envKey && config[envKey];
  });
};

/**
 * Calcula o health score de um provider combinando status de autenticação
 * e taxa de sucesso do benchmark (0-100).
 *
 * @param {object} auth - Resultado do health check.
 * @param {object} benchmark - Resultado do benchmark.
 * @returns {number} Score de 0 a 100.
 */
const calculateHealthScore = (auth, benchmark) => {
  let score = 0;
  if (auth.online) score += 20;
  if (benchmark && benchmark.overall) {
    score += benchmark.overall.successRate * 0.8; // Max 80 points
  }
  return Math.round(score);
};

const main = async () => {
  logger.box("AI PROVIDERS STATUS REPORT");

  validateEnv();

  logger.info("Initializing Pricing Engine...");
  await pricingEngine.updatePricing();

  startApi();
  logger.info("Express API started in background on configured port.\n");

  logger.info("Running Health Checks...");
  const healthResults = await runHealthCheck();

  logger.info("Running Balance Checks...");
  const balanceResults = await runBalanceCheck();

  logger.info("Running Benchmark (5 Light, 5 Medium tests)...");
  const benchmarkResults = await runBenchmark();

  updateApiState(healthResults, benchmarkResults);

  const finalReport = {
    timestamp: new Date().toISOString(),
    providers: {},
  };

  const activeProviders = getActiveProviders();
  logger.info(`Active providers: ${activeProviders.join(", ")}\n`);

  const benchmarkRanking = [];

  for (const provider of activeProviders) {
    const auth = healthResults[provider] || { online: false };
    const balance = balanceResults[provider] || {
      available: false,
      credits: "N/A",
    };
    const bench = benchmarkResults[provider];

    const healthScore = calculateHealthScore(auth, bench);

    finalReport.providers[provider] = {
      status: auth.online ? "online" : "offline",
      latency: bench?.overall?.avgLatency || 0,
      credits: balance.credits,
      healthScore,
      benchmark: bench,
    };

    logger.header(provider.toUpperCase());
    logger.info(`Status: ${auth.online ? "ONLINE" : "OFFLINE"}`);
    logger.info(`API Key: ${auth.online ? "VALID" : "INVALID/UNVERIFIED"}`);
    logger.info(`Average Latency: ${formatMs(bench?.overall?.avgLatency)}`);
    logger.info(`Average TTFB: ${formatMs(bench?.overall?.avgTtfb)}`);
    logger.info(
      `Balance/Credits: ${typeof balance.credits === "number" ? formatCurrency(balance.credits) : balance.credits}`,
    );
    logger.info(`Health Score: ${healthScore}/100`);
    logger.info(`Success Rate: ${bench?.overall?.successRate}%`);

    if (bench && auth.online) {
      benchmarkRanking.push({
        name: provider,
        latency: bench.overall.avgLatency,
      });
    }
  }

  benchmarkRanking.sort((a, b) => a.latency - b.latency);

  logger.box("BENCHMARK");
  for (let i = 0; i < benchmarkRanking.length; i++) {
    const entry = benchmarkRanking[i];
    const place = i === 0 ? "🏆 1º" : `${i + 1}º`;
    logger.info(
      `${place} ${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)} - Latência Média: ${formatMs(entry.latency)}`,
    );
  }

  if (benchmarkRanking.length > 0) {
    logger.success(
      `\nWinner: ${benchmarkRanking[0].name.charAt(0).toUpperCase() + benchmarkRanking[0].name.slice(1)}\n`,
    );
  } else {
    logger.warn(`\nWinner: None\n`);
  }

  // Relatório de uso de tokens
  logger.box("TOKEN USAGE");
  const grandTotal = tokenTracker.getGrandTotal();

  for (const provider of activeProviders) {
    const providerTokens = tokenTracker.getByProvider(provider);
    if (providerTokens) {
      logger.header(provider.toUpperCase());
      logger.info(`API Calls:          ${providerTokens.calls}`);
      logger.info(`Prompt Tokens:      ${providerTokens.promptTokens}`);
      logger.info(`Completion Tokens:  ${providerTokens.completionTokens}`);
      logger.info(`Total Tokens:       ${providerTokens.totalTokens}`);
      logger.info(
        `Estimated Cost:     ${formatCurrency(providerTokens.totalCost)}`,
      );
    }
  }

  logger.header("GRAND TOTAL (SESSION)");
  logger.info(`Total API Calls:        ${grandTotal.calls}`);
  logger.info(`Total Prompt Tokens:    ${grandTotal.promptTokens}`);
  logger.info(`Total Completion Tokens: ${grandTotal.completionTokens}`);
  logger.info(`Total Tokens Used:      ${grandTotal.totalTokens}`);
  logger.info(
    `Total Estimated Cost:   ${formatCurrency(grandTotal.totalCost)}`,
  );

  finalReport.tokenUsage = tokenTracker.toJSON();

  // Exporta relatórios JSON
  saveLatest(finalReport);
  saveBenchmark(benchmarkResults);
  saveHistory(finalReport);
  pricingEngine.exportCosts(tokenTracker.getRecords());
  logger.info("\nReports exported to reports/ directory.");
};

main().catch((err) => {
  logger.error(`Critical Error: ${err.message}`);
  process.exit(1);
});
