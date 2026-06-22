/**
 * TokenTracker - Acumulador global de uso de tokens.
 * Registra cada chamada feita por qualquer provider e mantém
 * totais por provider e um grand total da sessão.
 */

class TokenTracker {
  constructor() {
    this.records = [];
    this.totals = {};
  }

  /**
   * Registra uma chamada com seus tokens.
   * @param {string} provider - Nome do provider (ex: "openrouter", "xai")
   * @param {string} model - Modelo utilizado
   * @param {string} promptType - Tipo do prompt ("light", "medium", "auth", etc.)
   * @param {object} usage - { prompt_tokens, completion_tokens, total_tokens }
   * @param {number} cost - Custo estimado da chamada
   */
  track(provider, model, promptType, usage = {}, cost = 0) {
    const entry = {
      timestamp: new Date().toISOString(),
      provider,
      model: model || 'unknown',
      promptType,
      promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
      completionTokens: usage.completion_tokens || usage.completionTokens || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || 0,
      cost: cost || 0
    };

    this.records.push(entry);

    // Acumula por provider
    if (!this.totals[provider]) {
      this.totals[provider] = {
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalCost: 0
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
    let calls = 0, promptTokens = 0, completionTokens = 0, totalTokens = 0, totalCost = 0;
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
      records: this.records
    };
  }
}

// Singleton — uma única instância compartilhada por toda a aplicação
const tokenTracker = new TokenTracker();
export default tokenTracker;
