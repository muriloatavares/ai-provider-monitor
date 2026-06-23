import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import config from './config/env.js';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const REPORTS_DIR = path.resolve('reports');

const safeReadJSON = (filename) => {
  try {
    const file = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// V2 Dashboard Endpoints
app.get('/api/dashboard/summary', (req, res) => {
  const latest = safeReadJSON('latest.json');
  const tokenTracker = latest?.tokenUsage?.grandTotal || {};
  const costs = safeReadJSON('costs.json');
  
  res.json({
    onlineProviders: Object.keys(latest?.providers || {}).filter(k => latest.providers[k].status === 'online').length,
    monitoredProviders: Object.keys(latest?.providers || {}).length,
    totalTokens: tokenTracker.totalTokens || 0,
    totalCost: costs?.grandTotalCost || 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/providers', (req, res) => {
  const latest = safeReadJSON('latest.json');
  res.json(latest?.providers || {});
});

app.get('/api/models', (req, res) => {
  const ranking = safeReadJSON('model_ranking.json');
  res.json(ranking || []);
});

app.get('/api/rankings', (req, res) => {
  const ranking = safeReadJSON('model_ranking.json');
  res.json(ranking || []);
});

app.get('/api/costs', (req, res) => {
  const costs = safeReadJSON('costs.json');
  res.json(costs || {});
});

app.get('/api/history', (req, res) => {
  // Aggregate history logs or return stream benchmark
  const stream = safeReadJSON('streaming_benchmark.json');
  res.json(stream || {});
});

app.get('/api/router', (req, res) => {
  const router = safeReadJSON('router_recommendations.json');
  res.json(router || {});
});

app.get('/api/free-models', (req, res) => {
  const freeModels = safeReadJSON('free_models.json');
  res.json(freeModels || {});
});

app.get('/api/provider-analytics', (req, res) => {
  const history = safeReadJSON('providers_history.json');
  res.json(history || {});
});



app.post('/api/check-keys', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  // Stricter regex with minimum lengths to avoid false positives
  const orRegex = /sk-or-v1-[a-zA-Z0-9]{32,}/g;
  const groqRegex = /gsk_[a-zA-Z0-9]{20,}/g;
  const xaiRegex = /xai-[a-zA-Z0-9]{20,}/g;
  const openaiRegex = /(?:sk-proj-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{32,})/g;

  const foundKeys = [
    ...(text.match(orRegex) || []).map(k => ({ key: k, provider: 'OpenRouter' })),
    ...(text.match(groqRegex) || []).map(k => ({ key: k, provider: 'Groq' })),
    ...(text.match(xaiRegex) || []).map(k => ({ key: k, provider: 'xAI' })),
    ...(text.match(openaiRegex) || []).map(k => ({ key: k, provider: 'OpenAI' }))
  ];

  const uniqueKeys = [];
  const seen = new Set();
  for (const item of foundKeys) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      uniqueKeys.push(item);
    }
  }

  const results = await Promise.all(uniqueKeys.map(async (item) => {
    try {
      if (item.provider === 'OpenRouter') {
        const [authRes, modelsRes] = await Promise.all([
          axios.get('https://openrouter.ai/api/v1/auth/key', {
            headers: { Authorization: `Bearer ${item.key}` }
          }),
          axios.get('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${item.key}` }
          }).catch(() => null)
        ]);
        const data = authRes.data.data;
        const hasLimit = data.limit !== null && data.limit !== undefined;
        const usage = data.usage ?? 0;
        const isFreeTier = data.is_free_tier || false;
        
        // Determine real status — no more false "Unlimited"
        let status, balance;
        if (isFreeTier) {
          status = 'free_tier';
          balance = '$0 (Free Tier)';
        } else if (hasLimit) {
          const remaining = data.limit - usage;
          balance = remaining.toFixed(4);
          status = remaining <= 0 ? 'exhausted' : 'online';
        } else {
          // No spending limit set — we can't determine real balance
          status = 'no_limit';
          balance = `$${usage.toFixed(4)} used`;
        }

        let models = [];
        if (modelsRes?.data?.data) {
          models = modelsRes.data.data
            .filter(m => m.id)
            .map(m => ({ id: m.id, name: m.name || m.id }))
            .slice(0, 50);
        }

        return {
          key: item.key.substring(0, 15) + '...',
          fullKey: item.key,
          provider: item.provider,
          status,
          balance,
          rawLimit: data.limit,
          rawUsage: usage,
          models,
          modelCount: modelsRes?.data?.data?.length || 0,
          rateLimit: data.rate_limit || null,
          usage: {
            dollarsUsed: usage,
            dollarsLimit: data.limit || null,
            isFreeTier,
            label: data.label || null
          }
        };
      } 
      else if (item.provider === 'Groq') {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${item.key}` }
        });
        const h = response.headers;
        const models = (response.data?.data || [])
          .filter(m => m.id)
          .map(m => ({ id: m.id, name: m.id }));
        return {
          key: item.key.substring(0, 10) + '...',
          fullKey: item.key,
          provider: item.provider,
          status: 'online',
          balance: 'N/A (Free Tier)',
          models,
          modelCount: models.length,
          rateLimit: {
            requestsLimit: h['x-ratelimit-limit-requests'] || null,
            requestsRemaining: h['x-ratelimit-remaining-requests'] || null,
            requestsReset: h['x-ratelimit-reset-requests'] || null,
            tokensLimit: h['x-ratelimit-limit-tokens'] || null,
            tokensRemaining: h['x-ratelimit-remaining-tokens'] || null,
            tokensReset: h['x-ratelimit-reset-tokens'] || null
          }
        };
      }
      else if (item.provider === 'xAI') {
        const response = await axios.get('https://api.x.ai/v1/models', {
          headers: { Authorization: `Bearer ${item.key}` }
        });
        const h = response.headers;
        const models = (response.data?.data || response.data?.models || [])
          .filter(m => m.id)
          .map(m => ({ id: m.id, name: m.id }));
        return {
          key: item.key.substring(0, 10) + '...',
          fullKey: item.key,
          provider: item.provider,
          status: 'online',
          balance: 'N/A',
          models,
          modelCount: models.length,
          rateLimit: {
            requestsLimit: h['x-ratelimit-limit-requests'] || null,
            requestsRemaining: h['x-ratelimit-remaining-requests'] || null,
            tokensLimit: h['x-ratelimit-limit-tokens'] || null,
            tokensRemaining: h['x-ratelimit-remaining-tokens'] || null
          }
        };
      }
      else if (item.provider === 'OpenAI') {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${item.key}` }
        });
        const h = response.headers;
        const models = (response.data?.data || [])
          .filter(m => m.id)
          .map(m => ({ id: m.id, name: m.id }));
        return {
          key: item.key.substring(0, 15) + '...',
          fullKey: item.key,
          provider: item.provider,
          status: 'online',
          balance: 'N/A',
          models,
          modelCount: models.length,
          rateLimit: {
            requestsLimit: h['x-ratelimit-limit-requests'] || null,
            requestsRemaining: h['x-ratelimit-remaining-requests'] || null,
            requestsReset: h['x-ratelimit-reset-requests'] || null,
            tokensLimit: h['x-ratelimit-limit-tokens'] || null,
            tokensRemaining: h['x-ratelimit-remaining-tokens'] || null,
            tokensReset: h['x-ratelimit-reset-tokens'] || null
          }
        };
      }
    } catch (err) {
      return {
        key: item.key.substring(0, 15) + '...',
        fullKey: item.key,
        provider: item.provider,
        status: 'offline',
        balance: 0,
        error: err.response?.data?.error?.message || err.message,
        models: [],
        modelCount: 0,
        rateLimit: null
      };
    }
  }));

  res.json({ checked: results.length, results });
});

export const updateApiState = (health, benchmark) => {
  // Kept for backward compatibility if needed, but not used in V2
};

export const startApi = () => {
  app.listen(config.PORT, '127.0.0.1', () => {
    console.log(`API Server running on http://127.0.0.1:${config.PORT}`);
  });
};
