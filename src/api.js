import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import config from "./config/env.js";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const REPORTS_DIR = path.resolve("reports");

const safeReadJSON = (filename) => {
  try {
    const file = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// V2 Dashboard Endpoints
app.get("/api/dashboard/summary", (req, res) => {
  const latest = safeReadJSON("latest.json");
  const tokenTracker = latest?.tokenUsage?.grandTotal || {};
  const costs = safeReadJSON("costs.json");

  res.json({
    onlineProviders: Object.keys(latest?.providers || {}).filter(
      (k) => latest.providers[k].status === "online",
    ).length,
    monitoredProviders: Object.keys(latest?.providers || {}).length,
    totalTokens: tokenTracker.totalTokens || 0,
    totalCost: costs?.grandTotalCost || 0,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/providers", (req, res) => {
  const latest = safeReadJSON("latest.json");
  res.json(latest?.providers || {});
});

app.get("/api/models", (req, res) => {
  const ranking = safeReadJSON("model_ranking.json");
  res.json(ranking || []);
});

app.get("/api/rankings", (req, res) => {
  const ranking = safeReadJSON("model_ranking.json");
  res.json(ranking || []);
});

app.get("/api/costs", (req, res) => {
  const costs = safeReadJSON("costs.json");
  res.json(costs || {});
});

app.get("/api/history", (req, res) => {
  // Aggregate history logs or return stream benchmark
  const stream = safeReadJSON("streaming_benchmark.json");
  res.json(stream || {});
});

app.get("/api/router", (req, res) => {
  const router = safeReadJSON("router_recommendations.json");
  res.json(router || {});
});

app.get("/api/free-models", (req, res) => {
  const freeModels = safeReadJSON("free_models.json");
  res.json(freeModels || {});
});

app.get("/api/provider-analytics", (req, res) => {
  const history = safeReadJSON("providers_history.json");
  res.json(history || {});
});

const extractKeys = (text) => {
  const orRegex = /sk-or-v1-[a-zA-Z0-9]{32,}/g;
  const groqRegex = /gsk_[a-zA-Z0-9]{20,}/g;
  const xaiRegex = /xai-[a-zA-Z0-9]{20,}/g;
  const openaiRegex = /(?:sk-proj-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{32,})/g;
  const anthropicRegex = /sk-ant-[a-zA-Z0-9_-]{20,}/g;
  const geminiRegex = /AIzaSy[a-zA-Z0-9_-]{30,}/g;

  const foundKeys = [
    ...(text.match(orRegex) || []).map((k) => ({
      key: k,
      provider: "OpenRouter",
    })),
    ...(text.match(groqRegex) || []).map((k) => ({ key: k, provider: "Groq" })),
    ...(text.match(xaiRegex) || []).map((k) => ({ key: k, provider: "xAI" })),
    ...(text.match(openaiRegex) || []).map((k) => ({
      key: k,
      provider: "OpenAI",
    })),
    ...(text.match(anthropicRegex) || []).map((k) => ({
      key: k,
      provider: "Anthropic",
    })),
    ...(text.match(geminiRegex) || []).map((k) => ({
      key: k,
      provider: "Google AI",
    })),
  ];

  const uniqueKeys = [];
  const seen = new Set();
  for (const item of foundKeys) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      uniqueKeys.push(item);
    }
  }
  return uniqueKeys;
};

const mapAxiosErrorToStatus = (err) => {
  if (err.response) {
    const status = err.response.status;
    if (status === 401)
      return { keyStatus: "invalid", errorMsg: "Invalid Key (HTTP 401)" };
    if (status === 403)
      return {
        keyStatus: "restricted",
        errorMsg: "Permission Denied (HTTP 403)",
      };
    if (status === 429)
      return {
        keyStatus: "rate_limited",
        errorMsg: "Rate Limit Exceeded (HTTP 429)",
      };
    return {
      keyStatus: "error",
      errorMsg: err.response?.data?.error?.message || `HTTP ${status}`,
    };
  } else if (
    err.code === "ECONNABORTED" ||
    err.message.includes("timeout") ||
    err.code === "ENOTFOUND"
  ) {
    return { keyStatus: "unknown", errorMsg: "Connection Failed / Timeout" };
  }
  return { keyStatus: "error", errorMsg: err.message };
};

const validateKey = async (item) => {
  try {
    if (item.provider === "OpenRouter") {
      const [authRes, modelsRes] = await Promise.all([
        axios.get("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${item.key}` },
        }),
        axios
          .get("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${item.key}` },
          })
          .catch(() => null),
      ]);

      const data = authRes.data.data;
      const hasLimit = data.limit !== null && data.limit !== undefined;
      const usage = data.usage ?? 0;
      const isFreeTier = data.is_free_tier || false;

      let quotaStatus, balance;
      if (isFreeTier) {
        quotaStatus = "free_tier";
        balance = null;
      } else if (hasLimit) {
        const remaining = data.limit - usage;
        balance = remaining;
        quotaStatus = remaining <= 0 ? "exhausted" : "available";
      } else {
        quotaStatus = "unknown";
        balance = null;
      }

      let models = [];
      if (modelsRes?.data?.data) {
        models = modelsRes.data.data
          .filter((m) => m.id)
          .map((m) => ({ id: m.id, name: m.name || m.id }))
          .slice(0, 50);
      }

      return {
        provider: item.provider,
        key: item.key.substring(0, 15) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus,
        balance,
        limits: hasLimit ? data.limit : null,
        models,
        metadata: {
          error: null,
          rawUsage: usage,
          rateLimit: data.rate_limit || null,
          usageDetails: {
            dollarsUsed: usage,
            dollarsLimit: data.limit || null,
            isFreeTier,
            label: data.label || null,
          },
        },
      };
    } else if (item.provider === "Groq") {
      const response = await axios.get(
        "https://api.groq.com/openai/v1/models",
        {
          headers: { Authorization: `Bearer ${item.key}` },
        },
      );
      const h = response.headers;
      const models = (response.data?.data || [])
        .filter((m) => m.id)
        .map((m) => ({ id: m.id, name: m.id }));
      return {
        provider: item.provider,
        key: item.key.substring(0, 10) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus: "unknown",
        balance: null,
        limits: null,
        models,
        metadata: {
          error: null,
          rateLimit: {
            requestsLimit: h["x-ratelimit-limit-requests"] || null,
            requestsRemaining: h["x-ratelimit-remaining-requests"] || null,
            requestsReset: h["x-ratelimit-reset-requests"] || null,
            tokensLimit: h["x-ratelimit-limit-tokens"] || null,
            tokensRemaining: h["x-ratelimit-remaining-tokens"] || null,
            tokensReset: h["x-ratelimit-reset-tokens"] || null,
          },
        },
      };
    } else if (item.provider === "xAI") {
      const response = await axios.get("https://api.x.ai/v1/models", {
        headers: { Authorization: `Bearer ${item.key}` },
      });
      const h = response.headers;
      const models = (response.data?.data || response.data?.models || [])
        .filter((m) => m.id)
        .map((m) => ({ id: m.id, name: m.id }));
      return {
        provider: item.provider,
        key: item.key.substring(0, 10) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus: "unknown",
        balance: null,
        limits: null,
        models,
        metadata: {
          error: null,
          rateLimit: {
            requestsLimit: h["x-ratelimit-limit-requests"] || null,
            requestsRemaining: h["x-ratelimit-remaining-requests"] || null,
            tokensLimit: h["x-ratelimit-limit-tokens"] || null,
            tokensRemaining: h["x-ratelimit-remaining-tokens"] || null,
          },
        },
      };
    } else if (item.provider === "OpenAI") {
      const response = await axios.get("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${item.key}` },
      });
      const h = response.headers;
      const models = (response.data?.data || [])
        .filter((m) => m.id)
        .map((m) => ({ id: m.id, name: m.id }));
      return {
        provider: item.provider,
        key: item.key.substring(0, 15) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus: "unknown",
        balance: null,
        limits: null,
        models,
        metadata: {
          error: null,
          rateLimit: {
            requestsLimit: h["x-ratelimit-limit-requests"] || null,
            requestsRemaining: h["x-ratelimit-remaining-requests"] || null,
            requestsReset: h["x-ratelimit-reset-requests"] || null,
            tokensLimit: h["x-ratelimit-limit-tokens"] || null,
            tokensRemaining: h["x-ratelimit-remaining-tokens"] || null,
            tokensReset: h["x-ratelimit-reset-tokens"] || null,
          },
        },
      };
    } else if (item.provider === "Anthropic") {
      const response = await axios.get("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": item.key,
          "anthropic-version": "2023-06-01",
        },
      });
      const h = response.headers;
      const models = (response.data?.data || [])
        .filter((m) => m.id)
        .map((m) => ({ id: m.id, name: m.display_name || m.id }));
      return {
        provider: item.provider,
        key: item.key.substring(0, 15) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus: "unknown",
        balance: null,
        limits: null,
        models,
        metadata: {
          error: null,
          rateLimit: {
            requestsLimit: h["anthropic-ratelimit-requests-limit"] || null,
            requestsRemaining:
              h["anthropic-ratelimit-requests-remaining"] || null,
            requestsReset: h["anthropic-ratelimit-requests-reset"] || null,
            tokensLimit: h["anthropic-ratelimit-tokens-limit"] || null,
            tokensRemaining: h["anthropic-ratelimit-tokens-remaining"] || null,
            tokensReset: h["anthropic-ratelimit-tokens-reset"] || null,
          },
        },
      };
    } else if (item.provider === "Google AI") {
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${item.key}`,
      );
      const models = (response.data?.models || [])
        .filter((m) => m.name)
        .map((m) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name,
        }));

      return {
        provider: item.provider,
        key: item.key.substring(0, 15) + "...",
        fullKey: item.key,
        keyStatus: "valid",
        quotaStatus: "unknown",
        balance: null,
        limits: null,
        models,
        metadata: {
          error: null,
          googleApiKey: true,
          geminiAccess: models.some((m) =>
            m.id.toLowerCase().includes("gemini"),
          ),
          rateLimit: null,
        },
      };
    }
  } catch (err) {
    const { keyStatus, errorMsg } = mapAxiosErrorToStatus(err);

    return {
      provider: item.provider,
      key: item.key.substring(0, 15) + "...",
      fullKey: item.key,
      keyStatus,
      quotaStatus: "unknown",
      balance: null,
      limits: null,
      models: [],
      metadata: {
        error: errorMsg,
        rateLimit: null,
      },
    };
  }
};

app.post("/api/check-keys", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const uniqueKeys = extractKeys(text);
  const results = await Promise.all(uniqueKeys.map(validateKey));

  res.json({ checked: results.length, results });
});

app.post("/api/check-keys-stream", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).end();
    return;
  }

  const uniqueKeys = extractKeys(text);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(
    `event: init\ndata: ${JSON.stringify({ total: uniqueKeys.length })}\n\n`,
  );

  if (uniqueKeys.length === 0) {
    res.write(`event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`);
    res.end();
    return;
  }

  const concurrency = 10;
  const queue = [...uniqueKeys];

  const workers = Array(concurrency)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        const result = await validateKey(item);
        res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);
      }
    });

  await Promise.all(workers);

  res.write(`event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`);
  res.end();
});

export const updateApiState = (health, benchmark) => {
  // Kept for backward compatibility if needed, but not used in V2
};

export const startApi = () => {
  app.listen(config.PORT, "127.0.0.1", () => {
    console.log(`API Server running on http://127.0.0.1:${config.PORT}`);
  });
};
