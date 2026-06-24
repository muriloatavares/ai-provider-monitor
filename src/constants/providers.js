/**
 * @file providers.js
 * @description Constantes compartilhadas de configuração dos providers.
 *
 * Centraliza o mapeamento entre identificadores internos de providers
 * e suas respectivas variáveis de ambiente, eliminando duplicação
 * entre index.js, uptime.js e outros módulos.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

/**
 * Mapeamento entre o identificador interno do provider e a variável
 * de ambiente que contém sua API key.
 *
 * @type {Record<string, string>}
 */
export const PROVIDER_ENV_KEYS = {
  openrouter: "OPENROUTER_API_KEY",
  xai: "XAI_API_KEY",
  groq: "GROQ_API_KEY",
};
