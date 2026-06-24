/**
 * TokenTracker - Acumulador global de uso de tokens.
 * Registra cada chamada feita por qualquer provider e mantém
 * totais por provider e um grand total da sessão.
 */

import pricingEngine from "../services/pricingEngine.js";

class TokenTracker {
  constructor() {
    this.records = [];
    this.totals = {};
  }

  /**
   * Registra uma chamada com seus tokens e calcula o custo real via PricingEngine.
   */
  track(provider, model, promptType, usage = {}) {
    const promptTokens = usage.prompt_tokens || usage.promptTokens || 0;
    const completionTokens =
      usage.completion_tokens || usage.completionTokens || 0;
    const totalTokens = usage.total_tokens || usage.totalTokens || 0;

    // Auto-calculates cost dynamically
    const cost = pricingEngine.calculateCost(
      model,
      promptTokens,
      completionTokens,
    );

    const entry = {
      timestamp: new Date().toISOString(),
      provider,
      model: model || "unknown",
      promptType,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    };

    this.records.push(entry);

    // Acumula por provider
    if (!this.totals[provider]) {
      this.totals[provider] = {
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      };
    }

    this.totals[provider].calls++;
    this.totals[provider].promptTokens += entry.promptTokens;
    this.totals[provider].completionTokens += entry.completionTokens;
    this.totals[provider].totalTokens += entry.totalTokens;
    this.totals[provider].totalCost += entry.cost;
  }

  /** Retorna os totais por provider */
  getByProvider(provider) {
    return this.totals[provider] || null;
  }

  /** Retorna o grand total de toda a sessão */
  getGrandTotal() {
    let calls = 0,
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      totalCost = 0;
    for (const p of Object.values(this.totals)) {
      calls += p.calls;
      promptTokens += p.promptTokens;
      completionTokens += p.completionTokens;
      totalTokens += p.totalTokens;
      totalCost += p.totalCost;
    }
    return { calls, promptTokens, completionTokens, totalTokens, totalCost };
  }

  /** Retorna todos os registros individuais */
  getRecords() {
    return this.records;
  }

  /** Retorna snapshot completo para exportação */
  toJSON() {
    return {
      grandTotal: this.getGrandTotal(),
      byProvider: this.totals,
      records: this.records,
    };
  }
}

// Singleton — uma única instância compartilhada por toda a aplicação
const tokenTracker = new TokenTracker();
export default tokenTracker;
