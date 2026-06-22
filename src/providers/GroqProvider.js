import BaseProvider from './BaseProvider.js';
import config from '../config/env.js';
import tokenTracker from '../utils/tokenTracker.js';
import providerTracker from '../services/providerTracker.js';

export default class GroqProvider extends BaseProvider {
  constructor(customKey = null) {
    super('Groq', 'https://api.groq.com/openai/v1', customKey || config.GROQ_API_KEY, config.GROQ_MODEL);
  }

  async checkAuth() {
    try {
      const modelsRes = await this.client.get('/models');
      return {
        online: true,
        modelCount: modelsRes.data?.data?.length || 0
      };
    } catch (error) {
      return {
        online: false,
        error: error.response?.status ? `HTTP ${error.response.status}` : error.message
      };
    }
  }

  async getBalance() {
    // Groq does not provide a public balance/credits endpoint
    return {
      available: false,
      credits: 'NOT AVAILABLE'
    };
  }

  async generate(promptType = 'light') {
    const prompt = this.getPrompt(promptType);
    try {
      const res = await this.client.post('/chat/completions', {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }]
      });

      const data = res.data;
      const usage = data.usage || {};

      // Registra no tracker global
      tokenTracker.track('groq', data.model, promptType, usage, 0);

      // Registra infraestrutura e rate limits
      providerTracker.track('groq', data.model, res.duration, res.ttfb, res.status, res.headers);

      return {
        success: true,
        latency: res.duration,
        ttfb: res.ttfb,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        costEstimate: 0,
        model: data.model
      };
    } catch (error) {
      return {
        success: false,
        latency: error.duration || 0,
        error: error.response?.status ? `HTTP ${error.response.status}` : error.message
      };
    }
  }
}
