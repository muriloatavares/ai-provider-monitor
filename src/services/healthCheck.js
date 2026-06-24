import { providers } from "../providers/index.js";

export const runHealthCheck = async () => {
  const results = {};
  for (const [key, provider] of Object.entries(providers)) {
    const auth = await provider.checkAuth();
    results[key] = auth;
  }
  return results;
};
