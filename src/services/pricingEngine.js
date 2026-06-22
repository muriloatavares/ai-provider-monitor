import fs from 'fs';
import path from 'path';
import axios from 'axios';
import logger from '../utils/logger.js';

const CACHE_DIR = path.resolve('cache');
const PRICING_FILE = path.join(CACHE_DIR, 'pricing.json');
const COSTS_REPORT = path.resolve('reports', 'costs.json');

class PricingEngine {
  constructor() {
    this.models = {};
    this.updatedAt = null;
    this.loadCache();
  }

  loadCache() {
    try {
      if (fs.existsSync(PRICING_FILE)) {
        const data = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf-8'));
        this.models = data.models || {};
        this.updatedAt = data.updatedAt;
      }
    } catch (e) {
      logger.warn(`Failed to load pricing cache: ${e.message}`);
    }
  }

  saveCache() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(PRICING_FILE, JSON.stringify({
      updatedAt: this.updatedAt,
      models: this.models
    }, null, 2));
  }

  async updatePricing() {
    logger.info('Fetching latest pricing from OpenRouter...');
    try {
      const res = await axios.get('https://openrouter.ai/api/v1/models');
      const data = res.data.data;
      
      let updatedCount = 0;
      for (const model of data) {
        if (model.pricing) {
          this.models[model.id] = {
            prompt: parseFloat(model.pricing.prompt) || 0,
            completion: parseFloat(model.pricing.completion) || 0
          };
          updatedCount++;
        }
      }
      
      this.updatedAt = new Date().toISOString();
      this.saveCache();
      logger.success(`Pricing updated for ${updatedCount} models.`);
      return true;
    } catch (error) {
      logger.error(`Failed to update pricing: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculate exact cost for a request
   * @param {string} modelId - Model ID (e.g. 'anthropic/claude-3-haiku')
   * @param {number} promptTokens 
   * @param {number} completionTokens 
   * @returns {number} Cost in USD
   */
  calculateCost(modelId, promptTokens = 0, completionTokens = 0) {
    if (!this.models[modelId]) {
      return 0; // Unknown cost
    }
    const pricing = this.models[modelId];
    // OpenRouter pricing is already per token (e.g. 0.00000015)
    const promptCost = promptTokens * pricing.prompt;
    const completionCost = completionTokens * pricing.completion;
    return promptCost + completionCost;
  }

  /**
   * Export all tracked costs from TokenTracker to reports/costs.json
   */
  exportCosts(tokenTrackerRecords) {
    const report = {
      timestamp: new Date().toISOString(),
      sessions: []
    };

    let grandTotalCost = 0;

    for (const record of tokenTrackerRecords) {
      const exactCost = this.calculateCost(record.model, record.promptTokens, record.completionTokens);
      grandTotalCost += exactCost;

      report.sessions.push({
        timestamp: record.timestamp,
        provider: record.provider,
        model: record.model,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        exactCost: exactCost
      });
    }

    report.grandTotalCost = grandTotalCost;

    const reportsDir = path.dirname(COSTS_REPORT);
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    
    fs.writeFileSync(COSTS_REPORT, JSON.stringify(report, null, 2));
    return report;
  }
}

const engine = new PricingEngine();

// Allow running directly to update cache: node src/services/pricingEngine.js --update
if (process.argv.includes('--update')) {
  engine.updatePricing().then(() => process.exit(0));
}

export default engine;
