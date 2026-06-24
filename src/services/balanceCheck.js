/**
 * @file balanceCheck.js
 * @description Serviço de verificação de saldo e quotas dos LLM providers.
 *
 * Itera sobre os providers configurados para obter limites e uso.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { providers } from "../providers/index.js";

export const runBalanceCheck = async () => {
  const results = {};
  for (const [key, provider] of Object.entries(providers)) {
    const balance = await provider.getBalance();
    results[key] = balance;
  }
  return results;
};
