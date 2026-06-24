/**
 * @file healthCheck.js
 * @description Serviço de verificação de integridade dos LLM providers.
 *
 * Itera sobre todos os providers configurados e tenta autenticação.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { providers } from "../providers/index.js";

export const runHealthCheck = async () => {
  const results = {};
  for (const [key, provider] of Object.entries(providers)) {
    const auth = await provider.checkAuth();
    results[key] = auth;
  }
  return results;
};
