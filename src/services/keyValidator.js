/**
 * @file keyValidator.js
 * @description Serviço responsável pela validação de API keys contra os endpoints
 * reais de cada provider.
 *
 * Cada provider possui um handler dedicado que:
 * 1. Autentica a chave contra a API do provider
 * 2. Extrai informações de saldo, limites e modelos disponíveis
 * 3. Retorna um objeto padronizado `KeyValidationResult`
 *
 * Extraído de api.js para respeitar o princípio de responsabilidade única.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import axios from "axios";
import { mapAxiosErrorToStatus } from "../utils/httpErrorMapper.js";

/**
 * Mascara uma API key para exibição segura, preservando apenas
 * um prefixo identificável.
 *
 * @param {string} key - Chave completa.
 * @param {number} visibleChars - Quantidade de caracteres visíveis no início.
 * @returns {string} Chave mascarada (ex: "sk-or-v1-abc123...").
 */
const maskKey = (key, visibleChars = 15) => {
  return key.substring(0, visibleChars) + "...";
};

/**
 * Constrói o objeto de resultado padrão em caso de erro de validação.
 *
 * @param {object} item - Item original com key e provider.
 * @param {string} keyStatus - Status resultante da validação.
 * @param {string} errorMsg - Mensagem de erro descritiva.
 * @returns {object} Resultado padronizado de validação com erro.
 */
const buildErrorResult = (item, keyStatus, errorMsg) => ({
  provider: item.provider,
  key: maskKey(item.key),
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
});

/**
 * Handler de validação para chaves OpenRouter.
 * Consulta /auth/key para saldo e /models para catálogo.
 */
const validateOpenRouter = async (item) => {
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
    key: maskKey(item.key),
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
};

/**
 * Handler de validação para chaves Groq.
 * Consulta /models e extrai rate limits dos headers.
 */
const validateGroq = async (item) => {
  const response = await axios.get("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${item.key}` },
  });
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
};

/**
 * Handler de validação para chaves xAI.
 * Consulta /models e extrai rate limits dos headers.
 */
const validateXai = async (item) => {
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
};

/**
 * Handler de validação para chaves OpenAI.
 * Consulta /models e extrai rate limits dos headers.
 */
const validateOpenAI = async (item) => {
  const response = await axios.get("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${item.key}` },
  });
  const h = response.headers;
  const models = (response.data?.data || [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id, name: m.id }));

  return {
    provider: item.provider,
    key: maskKey(item.key),
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
};

/**
 * Handler de validação para chaves Anthropic.
 * Usa header x-api-key ao invés de Bearer token.
 */
const validateAnthropic = async (item) => {
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
    key: maskKey(item.key),
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
        requestsRemaining: h["anthropic-ratelimit-requests-remaining"] || null,
        requestsReset: h["anthropic-ratelimit-requests-reset"] || null,
        tokensLimit: h["anthropic-ratelimit-tokens-limit"] || null,
        tokensRemaining: h["anthropic-ratelimit-tokens-remaining"] || null,
        tokensReset: h["anthropic-ratelimit-tokens-reset"] || null,
      },
    },
  };
};

/**
 * Handler de validação para chaves Google AI (Gemini).
 * Usa query parameter ao invés de header de autenticação.
 */
const validateGoogleAI = async (item) => {
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
    key: maskKey(item.key),
    fullKey: item.key,
    keyStatus: "valid",
    quotaStatus: "unknown",
    balance: null,
    limits: null,
    models,
    metadata: {
      error: null,
      googleApiKey: true,
      geminiAccess: models.some((m) => m.id.toLowerCase().includes("gemini")),
      rateLimit: null,
    },
  };
};

/**
 * Despacha a validação para o handler correto com base no provider.
 *
 * @type {Record<string, function>}
 */
const PROVIDER_HANDLERS = {
  OpenRouter: validateOpenRouter,
  Groq: validateGroq,
  xAI: validateXai,
  OpenAI: validateOpenAI,
  Anthropic: validateAnthropic,
  "Google AI": validateGoogleAI,
};

/**
 * Valida uma API key contra o endpoint real do seu provider.
 *
 * @param {{key: string, provider: string}} item - Chave e provider a validar.
 * @returns {Promise<object>} Resultado padronizado da validação.
 */
export const validateKey = async (item) => {
  try {
    const handler = PROVIDER_HANDLERS[item.provider];
    if (!handler) {
      return buildErrorResult(
        item,
        "error",
        `Unsupported provider: ${item.provider}`,
      );
    }
    return await handler(item);
  } catch (err) {
    const { keyStatus, errorMsg } = mapAxiosErrorToStatus(err);
    return buildErrorResult(item, keyStatus, errorMsg);
  }
};
