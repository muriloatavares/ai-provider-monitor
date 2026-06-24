/**
 * @file modelRanking.js
 * @description Serviço de ranqueamento global de modelos LLM.
 *
 * Consome os dados de preços (pricingEngine) e latência
 * (streamingBenchmark) para produzir um ranking ordenado
 * dos melhores modelos considerando velocidade e custo.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const REPORTS_DIR = path.resolve("reports");
const CARDS_DIR = path.join(REPORTS_DIR, "model_cards");

const safeReadJSON = (filename) => {
  try {
    const file = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    logger.warn(`Could not read ${filename}`);
  }
  return null;
};

class ModelRanking {
  constructor() {
    this.modelsData = {};
  }

  loadData() {
    const benchmark = safeReadJSON("benchmark.json");
    const streaming = safeReadJSON("streaming_benchmark.json");
    const costs = safeReadJSON("costs.json");
    const history = safeReadJSON("providers_history.json");
    const uptime = safeReadJSON("uptime.json");

    // Parse Benchmark (Latency, Success Rate)
    if (benchmark) {
      for (const [provider, data] of Object.entries(benchmark)) {
        if (!data.overall) continue;
        const modelId = data.model || `${provider}-default`;
        this.initModel(modelId, provider);

        this.modelsData[modelId].latencySum += data.overall.avgLatency;
        this.modelsData[modelId].latencyCount++;
        this.modelsData[modelId].successRate = data.overall.successRate;
      }
    }

    // Parse Streaming (TTFB, TPS)
    if (streaming && streaming.results) {
      for (const res of streaming.results) {
        if (!res.model) continue;
        this.initModel(res.model, res.provider);
        this.modelsData[res.model].ttfbSum += res.ttfb || 0;
        this.modelsData[res.model].ttfbCount++;
        if (res.tps > 0) {
          this.modelsData[res.model].tpsSum += res.tps;
          this.modelsData[res.model].tpsCount++;
        }
      }
    }

    // Parse History (Error Rate, Reliability)
    if (history && history.history) {
      for (const h of history.history) {
        if (!h.model) continue;
        this.initModel(h.model, h.mainProvider);
        this.modelsData[h.model].requestsTotal++;
        if (h.status !== 200) {
          this.modelsData[h.model].requestsFailed++;
        }
      }
    }

    // Cost Efficiency (Cost per Million)
    // Actually we can just get the exact pricing from pricing engine, but we'll use costs.json sessions
    if (costs && costs.sessions) {
      for (const s of costs.sessions) {
        if (!s.model) continue;
        this.initModel(s.model, s.provider);
        this.modelsData[s.model].costSum += s.exactCost;
        this.modelsData[s.model].tokensSum += s.totalTokens;
      }
    }

    // Uptime
    if (uptime && uptime.providers) {
      for (const [provider, data] of Object.entries(uptime.providers)) {
        // Uptime is per provider, so we apply to all models of this provider
        for (const model of Object.values(this.modelsData)) {
          if (model.provider === provider) {
            model.uptime = data.uptimePercent || 100;
          }
        }
      }
    }
  }

  initModel(modelId, provider) {
    if (!this.modelsData[modelId]) {
      this.modelsData[modelId] = {
        model: modelId,
        provider: provider,
        latencySum: 0,
        latencyCount: 0,
        ttfbSum: 0,
        ttfbCount: 0,
        tpsSum: 0,
        tpsCount: 0,
        requestsTotal: 0,
        requestsFailed: 0,
        costSum: 0,
        tokensSum: 0,
        successRate: 100, // default
        uptime: 100, // default
      };
    }
  }

  calculateScores() {
    const rankings = [];

    for (const [modelId, data] of Object.entries(this.modelsData)) {
      const avgLatency =
        data.latencyCount > 0 ? data.latencySum / data.latencyCount : 500;
      const avgTtfb = data.ttfbCount > 0 ? data.ttfbSum / data.ttfbCount : 500;
      const avgTps = data.tpsCount > 0 ? data.tpsSum / data.tpsCount : 10;

      const errorRate =
        data.requestsTotal > 0
          ? (data.requestsFailed / data.requestsTotal) * 100
          : 0;
      const actualSuccessRate =
        data.requestsTotal > 0 ? 100 - errorRate : data.successRate;

      const costPerMillion =
        data.tokensSum > 0 ? (data.costSum / data.tokensSum) * 1000000 : 0;

      // Scoring formulas (0-100)
      // Performance (40%): lower latency/ttfb is better, higher tps is better
      let perfScore = 100 - avgLatency / 20 - avgTtfb / 10 + avgTps * 0.5;
      perfScore = Math.max(0, Math.min(100, perfScore));

      // Reliability (35%): higher success rate & uptime is better, lower error is better
      let relScore = actualSuccessRate * 0.5 + data.uptime * 0.5 - errorRate;
      relScore = Math.max(0, Math.min(100, relScore));

      // Cost (25%): lower is better. Assuming $10 per 1M is expensive (score 0), $0 is free (score 100)
      let costScore = 100 - costPerMillion * 10;
      costScore = Math.max(0, Math.min(100, costScore));

      const overallScore = perfScore * 0.4 + relScore * 0.35 + costScore * 0.25;

      rankings.push({
        model: modelId,
        provider: data.provider,
        overallScore: parseFloat(overallScore.toFixed(1)),
        performanceScore: parseFloat(perfScore.toFixed(1)),
        reliabilityScore: parseFloat(relScore.toFixed(1)),
        costScore: parseFloat(costScore.toFixed(1)),
        metrics: {
          avgLatency: Math.round(avgLatency),
          avgTTFB: Math.round(avgTtfb),
          avgTPS: parseFloat(avgTps.toFixed(1)),
          successRate: parseFloat(actualSuccessRate.toFixed(1)),
          uptime: parseFloat(data.uptime.toFixed(2)),
          costPer1M: parseFloat(costPerMillion.toFixed(4)),
          benchmarkRuns: data.requestsTotal + data.latencyCount,
        },
      });
    }

    return rankings
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((r, index) => ({
        rank: index + 1,
        ...r,
      }));
  }

  generateCards(rankings) {
    if (!fs.existsSync(CARDS_DIR)) {
      fs.mkdirSync(CARDS_DIR, { recursive: true });
    }

    for (const r of rankings) {
      const safeName = r.model.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const cardPath = path.join(CARDS_DIR, `${safeName}.json`);

      const card = {
        model: r.model,
        provider: r.provider,
        overallScore: Math.round(r.overallScore),
        healthScore: Math.round(r.reliabilityScore), // as requested in model cards example
        uptime: r.metrics.uptime,
        avgLatency: r.metrics.avgLatency,
        avgTTFB: r.metrics.avgTTFB,
        avgTPS: r.metrics.avgTPS,
        costPer1M: r.metrics.costPer1M,
        benchmarkRuns: r.metrics.benchmarkRuns,
      };

      fs.writeFileSync(cardPath, JSON.stringify(card, null, 2));
    }
  }

  execute() {
    logger.info("Loading observability data for Intelligence Engine...");
    this.loadData();

    const rankings = this.calculateScores();

    if (rankings.length === 0) {
      logger.warn(
        "Not enough data to generate rankings. Run benchmarks first.",
      );
      return;
    }

    const rankingFile = path.join(REPORTS_DIR, "model_ranking.json");
    fs.writeFileSync(rankingFile, JSON.stringify(rankings, null, 2));
    logger.success(
      `\nGenerated model_ranking.json with ${rankings.length} models.`,
    );

    this.generateCards(rankings);
    logger.success(
      `Generated ${rankings.length} individual Model Cards in reports/model_cards/`,
    );

    logger.box("TOP 5 INTELLIGENCE RANKING");
    for (let i = 0; i < Math.min(5, rankings.length); i++) {
      const r = rankings[i];
      logger.header(`🏆 ${r.rank}º - ${r.model}`);
      logger.info(`Score: ${r.overallScore}/100`);
      logger.info(
        `Perf: ${r.performanceScore} | Rel: ${r.reliabilityScore} | Cost: ${r.costScore}`,
      );
    }
  }
}

const ranking = new ModelRanking();
ranking.execute();
