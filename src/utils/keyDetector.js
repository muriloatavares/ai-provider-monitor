/**
 * @file keyDetector.js
 * @description Utilitário para detecção e extração de API keys a partir de texto bruto.
 *
 * Centraliza todas as expressões regulares de identificação de chaves
 * e a lógica de detecção de provider por prefixo, eliminando duplicação
 * entre api.js, bulk.js e models.js.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

/**
 * Padrões regex para cada provider suportado.
 * Cada entrada mapeia o nome do provider para sua regex de detecção.
 *
 * @type {Array<{regex: RegExp, provider: string}>}
 */
const KEY_PATTERNS = [
  { regex: /sk-or-v1-[a-zA-Z0-9]{32,}/g, provider: "OpenRouter" },
  { regex: /gsk_[a-zA-Z0-9]{20,}/g, provider: "Groq" },
  { regex: /xai-[a-zA-Z0-9]{20,}/g, provider: "xAI" },
  {
    regex: /(?:sk-proj-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{32,})/g,
    provider: "OpenAI",
  },
  { regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g, provider: "Anthropic" },
  { regex: /AIzaSy[a-zA-Z0-9_-]{30,}/g, provider: "Google AI" },
];

/**
 * Extrai todas as API keys reconhecidas de um bloco de texto,
 * removendo duplicatas e preservando a ordem de descoberta.
 *
 * @param {string} text - Texto bruto contendo possíveis API keys.
 * @returns {Array<{key: string, provider: string}>} Lista de chaves únicas encontradas.
 */
export const extractKeys = (text) => {
  const foundKeys = [];

  for (const { regex, provider } of KEY_PATTERNS) {
    // Reseta o lastIndex da regex global antes de cada uso
    regex.lastIndex = 0;
    const matches = text.match(regex) || [];
    for (const key of matches) {
      foundKeys.push({ key, provider });
    }
  }

  // Deduplicação preservando a primeira ocorrência de cada chave
  const seen = new Set();
  const uniqueKeys = [];

  for (const item of foundKeys) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      uniqueKeys.push(item);
    }
  }

  return uniqueKeys;
};

/**
 * Detecta o provider de uma chave pelo seu prefixo.
 * Utilizado pelo bulk checker e model lister para instanciar
 * o provider correto sem precisar de regex completa.
 *
 * @param {string} key - A API key para identificar.
 * @returns {string} Identificador interno do provider (lowercase).
 */
export const detectProvider = (key) => {
  if (key.startsWith("sk-or-v1-")) return "openrouter";
  if (key.startsWith("xai-")) return "xai";
  if (key.startsWith("gsk_")) return "groq";
  return "openrouter";
};
