/**
 * @file autoRouter.js
 * @description Serviço de recomendação de modelos baseado em custo-benefício.
 *
 * Analisa latência histórica, custos do pricingEngine e janelas
 * de contexto para sugerir o modelo LLM ideal (mais barato, mais rápido
 * e melhor balanceado).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const REPORTS_DIR = path.resolve("reports");
const RANKING_FILE = path.join(REPORTS_DIR, "model_ranking.json");
const ROUTER_OUTPUT = path.join(REPORTS_DIR, "router_recommendations.json");

class AutoRouter {
  generate() {
    logger.info("Reading Model Intelligence Rankings...");
    if (!fs.existsSync(RANKING_FILE)) {
      logger.error(
        'model_ranking.json not found! Run "npm run ranking" first.',
      );
      process.exit(1);
    }

    const rankings = JSON.parse(fs.readFileSync(RANKING_FILE, "utf8"));

    if (rankings.length === 0) {
      logger.warn("No models available to generate routing chains.");
      return;
    }

    // Calculate averages for thresholds
    let totalLatency = 0,
      totalTtfb = 0;
    for (const r of rankings) {
      totalLatency += r.metrics.avgLatency;
      totalTtfb += r.metrics.avgTTFB;
    }
    const avgGlobalLatency = totalLatency / rankings.length;
    const avgGlobalTtfb = totalTtfb / rankings.length;

    logger.info(
      `Global Averages - Latency: ${Math.round(avgGlobalLatency)}ms | TTFB: ${Math.round(avgGlobalTtfb)}ms`,
    );

    // Eligibility Criteria
    const eligibleModels = rankings.filter((r) => {
      const isReliable =
        r.metrics.successRate >= 95 &&
        r.reliabilityScore >= 90 &&
        r.metrics.uptime >= 99;
      const isFast =
        r.metrics.avgLatency <= avgGlobalLatency &&
        r.metrics.avgTTFB <= avgGlobalTtfb;
      return isReliable && isFast;
    });

    // If eligibility is too strict and returns empty, we relax the fast condition
    const pool =
      eligibleModels.length >= 3
        ? eligibleModels
        : rankings.filter((r) => r.metrics.successRate >= 90);

    // Generation of Chains (Top 3 for each category)
    const generateChain = (poolData, sortFn) => {
      return [...poolData]
        .sort(sortFn)
        .slice(0, 3)
        .map((r) => r.model);
    };

    const fastestChain = generateChain(
      pool,
      (a, b) => b.performanceScore - a.performanceScore,
    );
    const cheapestChain = generateChain(
      pool,
      (a, b) => b.costScore - a.costScore,
    );
    const reliableChain = generateChain(
      pool,
      (a, b) => b.reliabilityScore - a.reliabilityScore,
    );
    const balancedChain = generateChain(
      pool,
      (a, b) => b.overallScore - a.overallScore,
    );

    const report = {
      timestamp: new Date().toISOString(),
      recommendedChain: balancedChain,
      fastestChain,
      cheapestChain,
      reliableChain,
      balancedChain,
    };

    fs.writeFileSync(ROUTER_OUTPUT, JSON.stringify(report, null, 2));

    logger.box("AUTO ROUTER GENERATOR");

    logger.header("🚀 FASTEST CHAIN");
    logger.info(JSON.stringify(fastestChain, null, 2));

    logger.header("💰 CHEAPEST CHAIN");
    logger.info(JSON.stringify(cheapestChain, null, 2));

    logger.header("🛡️ MOST RELIABLE CHAIN");
    logger.info(JSON.stringify(reliableChain, null, 2));

    logger.header("⚖️ BALANCED CHAIN (Recommended)");
    logger.success(JSON.stringify(balancedChain, null, 2));

    logger.info(`\nRouter configurations exported to: ${ROUTER_OUTPUT}`);
  }
}

const router = new AutoRouter();
router.generate();
