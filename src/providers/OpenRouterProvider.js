/**
 * @file OpenRouterProvider.js
 * @description Conector específico para a API do OpenRouter.
 *
 * Implementa autenticação, verificação de saldo e execução de testes
 * de completamento (streaming e standard) via OpenRouter.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import BaseProvider from "./BaseProvider.js";
import config from "../config/env.js";
import tokenTracker from "../utils/tokenTracker.js";
import providerTracker from "../services/providerTracker.js";

export default class OpenRouterProvider extends BaseProvider {
  constructor(customKey = null) {
    super(
      "OpenRouter",
      "https://openrouter.ai/api/v1",
      customKey || config.OPENROUTER_API_KEY,
      config.OPENROUTER_MODEL,
    );
  }

  async checkAuth() {
    try {
      // Check auth key
      await this.client.get("/auth/key");
      // Check models
      const modelsRes = await this.client.get("/models");
      return {
        online: true,
        modelCount: modelsRes.data?.data?.length || 0,
      };
    } catch (error) {
      return {
        online: false,
        error: error.response?.status
          ? `HTTP ${error.response.status}`
          : error.message,
      };
    }
  }

  async getBalance() {
    try {
      const res = await this.client.get("/auth/key");
      const data = res.data.data;
      const limit = data.limit;
      const usage = data.usage ?? 0;
      const isFreeTier = data.is_free_tier ?? null;
      const rateLimit = data.rate_limit ?? null;

      // If limit exists, calculate remaining. Otherwise show usage only.
      const remaining =
        limit !== null && limit !== undefined ? limit - usage : null;

      return {
        available: true,
        credits: remaining,
        limit: limit ?? "unknown",
        usage,
        isFreeTier,
        rateLimit,
        // Human-friendly summary for display
        summary:
          remaining !== null
            ? `$${remaining.toFixed(4)} remaining (used $${usage.toFixed(4)} of $${limit.toFixed(4)})`
            : `$${usage.toFixed(4)} used (limits unknown)`,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  async generate(promptType = "light") {
    const prompt = this.getPrompt(promptType);
    try {
      const res = await this.client.post("/chat/completions", {
        model: this.defaultModel,
        messages: [{ role: "user", content: prompt }],
      });

      const data = res.data;
      const usage = data.usage || {};
      const cost = res.data.usage?.total_cost || 0;

      // Registra no tracker global de tokens
      tokenTracker.track("openrouter", data.model, promptType, usage, cost);

      // Registra no tracker de provedores reais (infraestrutura)
      providerTracker.track(
        "openrouter",
        data.model,
        res.duration,
        res.ttfb,
        res.status,
        res.headers,
      );

      return {
        success: true,
        latency: res.duration,
        ttfb: res.ttfb,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        costEstimate: cost,
        model: data.model,
      };
    } catch (error) {
      return {
        success: false,
        latency: error.duration || 0,
        error: error.response?.status
          ? `HTTP ${error.response.status}`
          : error.message,
      };
    }
  }
}
