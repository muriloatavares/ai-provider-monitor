import { validateEnv } from './config/env.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import { runHealthCheck } from './services/healthCheck.js';
import { runBalanceCheck } from './services/balanceCheck.js';
import { runBenchmark } from './services/benchmark.js';
import { saveLatest, saveBenchmark, saveHistory } from './utils/exporter.js';
import { formatCurrency, formatMs } from './utils/formatter.js';
import { startApi, updateApiState } from './api.js';
import tokenTracker from './utils/tokenTracker.js';
import { providers } from './providers/index.js';
import pricingEngine from './services/pricingEngine.js';

// Map provider keys to their corresponding env config keys
const providerKeyMap = {
  openrouter: 'OPENROUTER_API_KEY',
  xai: 'XAI_API_KEY',
  groq: 'GROQ_API_KEY'
};

const getActiveProviders = () => {
  return Object.keys(providers).filter(name => {
    const envKey = providerKeyMap[name];
    return envKey && config[envKey];
  });
};

const calculateHealthScore = (auth, benchmark) => {
  let score = 0;
  if (auth.online) score += 20;
  if (benchmark && benchmark.overall) {
    score += benchmark.overall.successRate * 0.8; // Max 80 points
  }
  return Math.round(score);
};

const main = async () => {
  logger.box('AI PROVIDERS STATUS REPORT');
  
  validateEnv();

  logger.info('Initializing Pricing Engine...');
  await pricingEngine.updatePricing();

  // Start Express API in background
  startApi();
  logger.info('Express API started in background on configured port.\n');

  logger.info('Running Health Checks...');
  const healthResults = await runHealthCheck();
  
  logger.info('Running Balance Checks...');
  const balanceResults = await runBalanceCheck();
  
  logger.info('Running Benchmark (5 Light, 5 Medium tests)...');
  const benchmarkResults = await runBenchmark();

  updateApiState(healthResults, benchmarkResults);

  const finalReport = {
    timestamp: new Date().toISOString(),
    providers: {}
  };

  const activeProviders = getActiveProviders();
  logger.info(`Active providers: ${activeProviders.join(', ')}\n`);

  const benchmarkRanking = [];

  for (const provider of activeProviders) {
    const auth = healthResults[provider] || { online: false };
    const balance = balanceResults[provider] || { available: false, credits: 'N/A' };
    const bench = benchmarkResults[provider];

    const healthScore = calculateHealthScore(auth, bench);

    finalReport.providers[provider] = {
      status: auth.online ? 'online' : 'offline',
      latency: bench?.overall?.avgLatency || 0,
      credits: balance.credits,
      healthScore,
      benchmark: bench
    };

    logger.header(provider.toUpperCase());
    logger.info(`Status: ${auth.online ? 'ONLINE' : 'OFFLINE'}`);
    logger.info(`API Key: ${auth.online ? 'VALID' : 'INVALID/UNVERIFIED'}`);
    logger.info(`Average Latency: ${formatMs(bench?.overall?.avgLatency)}`);
    logger.info(`Average TTFB: ${formatMs(bench?.overall?.avgTtfb)}`);
    logger.info(`Balance/Credits: ${typeof balance.credits === 'number' ? formatCurrency(balance.credits) : balance.credits}`);
    logger.info(`Health Score: ${healthScore}/100`);
    logger.info(`Success Rate: ${bench?.overall?.successRate}%`);

    if (bench && auth.online) {
      benchmarkRanking.push({
        name: provider,
        latency: bench.overall.avgLatency
      });
    }
  }

  // Sorting ascending by latency
  benchmarkRanking.sort((a, b) => a.latency - b.latency);

  logger.box('BENCHMARK');
  for (let i = 0; i < benchmarkRanking.length; i++) {
    const b = benchmarkRanking[i];
    const place = i === 0 ? '🏆 1º' : `${i + 1}º`;
    logger.info(`${place} ${b.name.charAt(0).toUpperCase() + b.name.slice(1)} - Latência Média: ${formatMs(b.latency)}`);
  }

  if (benchmarkRanking.length > 0) {
    logger.success(`\nWinner: ${benchmarkRanking[0].name.charAt(0).toUpperCase() + benchmarkRanking[0].name.slice(1)}\n`);
  } else {
    logger.warn(`\nWinner: None\n`);
  }

  // Token Usage Report
  logger.box('TOKEN USAGE');
  const grandTotal = tokenTracker.getGrandTotal();

  for (const provider of activeProviders) {
    const providerTokens = tokenTracker.getByProvider(provider);
    if (providerTokens) {
      logger.header(provider.toUpperCase());
      logger.info(`API Calls:          ${providerTokens.calls}`);
      logger.info(`Prompt Tokens:      ${providerTokens.promptTokens}`);
      logger.info(`Completion Tokens:  ${providerTokens.completionTokens}`);
      logger.info(`Total Tokens:       ${providerTokens.totalTokens}`);
      logger.info(`Estimated Cost:     ${formatCurrency(providerTokens.totalCost)}`);
    }
  }

  logger.header('GRAND TOTAL (SESSION)');
  logger.info(`Total API Calls:        ${grandTotal.calls}`);
  logger.info(`Total Prompt Tokens:    ${grandTotal.promptTokens}`);
  logger.info(`Total Completion Tokens: ${grandTotal.completionTokens}`);
  logger.info(`Total Tokens Used:      ${grandTotal.totalTokens}`);
  logger.info(`Total Estimated Cost:   ${formatCurrency(grandTotal.totalCost)}`);

  // Inject token data into the final report
  finalReport.tokenUsage = tokenTracker.toJSON();

  // Export JSON Reports
  saveLatest(finalReport);
  saveBenchmark(benchmarkResults);
  saveHistory(finalReport);
  pricingEngine.exportCosts(tokenTracker.getRecords());
  logger.info('\nReports exported to reports/ directory.');
};

main().catch(err => {
  logger.error(`Critical Error: ${err.message}`);
  process.exit(1);
});
