import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { validateEnv } from '../config/env.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import OpenRouterProvider from '../providers/OpenRouterProvider.js';

const REPORT_FILE = path.resolve('reports', 'free_models.json');

class FreeModelDiscovery {
  async discover() {
    logger.info('Fetching model catalog from OpenRouter...');
    try {
      const res = await axios.get('https://openrouter.ai/api/v1/models');
      const allModels = res.data.data;
      
      const freeModels = allModels.filter(m => {
        if (!m.pricing) return false;
        const promptPrice = parseFloat(m.pricing.prompt);
        const completionPrice = parseFloat(m.pricing.completion);
        return promptPrice === 0 && completionPrice === 0;
      });

      logger.success(`Found ${freeModels.length} totally free models.`);
      return freeModels.map(m => m.id);
    } catch (error) {
      logger.error(`Failed to fetch models: ${error.message}`);
      return [];
    }
  }

  async runBenchmark(modelId, provider) {
    provider.defaultModel = modelId; // override the model
    return await provider.generate('light');
  }

  async execute() {
    validateEnv();
    
    if (!config.OPENROUTER_API_KEY) {
      logger.error('OPENROUTER_API_KEY is required for free model discovery.');
      process.exit(1);
    }

    logger.box('FREE MODEL DISCOVERY');
    
    const freeModelIds = await this.discover();
    if (freeModelIds.length === 0) {
      logger.warn('No free models found.');
      return;
    }

    logger.info('\nRunning quick benchmark on free models...\n');
    
    const provider = new OpenRouterProvider(config.OPENROUTER_API_KEY);
    const results = [];

    // Let's test a subset or all of them. Testing all might take a while and hit rate limits.
    // We'll test all but sequentially with a small delay to avoid 429s if there are many.
    // Actually, OpenRouter has like 20-30 free models. We can just test them.
    for (let i = 0; i < freeModelIds.length; i++) {
      const modelId = freeModelIds[i];
      logger.header(`[${i+1}/${freeModelIds.length}] Testing ${modelId}...`);
      
      const start = performance.now();
      const bench = await this.runBenchmark(modelId, provider);
      const end = performance.now();
      
      const status = bench.success ? 'online' : 'offline';
      
      logger.info(`Status: ${status.toUpperCase()} | Latency: ${bench.latency}ms`);
      
      if (!bench.success) {
        logger.warn(`Error: ${bench.error}`);
      }

      results.push({
        model: modelId,
        provider: 'openrouter',
        status: status,
        latency: Math.round(bench.latency || 0),
        ttfb: Math.round(bench.ttfb || 0),
        tps: bench.completionTokens && bench.latency ? parseFloat(((bench.completionTokens / (bench.latency / 1000)).toFixed(2))) : 0,
        tokens: bench.totalTokens || 0,
        error: bench.error || null
      });

      // Avoid spamming
      await new Promise(r => setTimeout(r, 200));
    }

    // Export
    const dir = path.dirname(REPORT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const finalReport = {
      timestamp: new Date().toISOString(),
      totalFound: freeModelIds.length,
      totalOnline: results.filter(r => r.status === 'online').length,
      models: results.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'online' ? -1 : 1;
        return a.latency - b.latency;
      })
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(finalReport, null, 2));

    logger.box('FREE MODELS AVAILABLE (Top 10 Fastest)');
    const topOnline = finalReport.models.filter(m => m.status === 'online').slice(0, 10);
    
    for (const m of topOnline) {
      logger.info(`📦 ${m.model}`);
      logger.success(`   online | ${m.latency}ms | ~${m.tps} tps\n`);
    }

    logger.info(`Full report saved to: ${REPORT_FILE}`);
  }
}

const discovery = new FreeModelDiscovery();
discovery.execute().catch(err => {
  logger.error(err.message);
  process.exit(1);
});
