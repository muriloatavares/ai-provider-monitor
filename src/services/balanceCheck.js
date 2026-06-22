import { providers } from '../providers/index.js';

export const runBalanceCheck = async () => {
  const results = {};
  for (const [key, provider] of Object.entries(providers)) {
    const balance = await provider.getBalance();
    results[key] = balance;
  }
  return results;
};
