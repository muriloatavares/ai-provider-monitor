/**
 * @file benchmark.js
 * @description Motor principal de execução de testes de desempenho.
 *
 * Realiza testes de geração de texto (standard) com diferentes níveis
 * de complexidade (light, medium) para calcular TTFB, latência e taxa
 * de sucesso de cada provider.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { providers } from "../providers/index.js";

export const runBenchmark = async () => {
  const results = {};

  for (const [key, provider] of Object.entries(providers)) {
    let lightSuccess = 0,
      mediumSuccess = 0;
    let lightFail = 0,
      mediumFail = 0;

    let lightLatencies = [];
    let lightTtfbs = [];
    let mediumLatencies = [];
    let mediumTtfbs = [];

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    // Run 5 Light Tests
    for (let i = 0; i < 5; i++) {
      const res = await provider.generate("light");
      if (res.success) {
        lightSuccess++;
        lightLatencies.push(res.latency);
        lightTtfbs.push(res.ttfb);
        totalPromptTokens += res.promptTokens;
        totalCompletionTokens += res.completionTokens;
        totalTokens += res.totalTokens;
      } else {
        lightFail++;
      }
    }

    // Run 5 Medium Tests
    for (let i = 0; i < 5; i++) {
      const res = await provider.generate("medium");
      if (res.success) {
        mediumSuccess++;
        mediumLatencies.push(res.latency);
        mediumTtfbs.push(res.ttfb);
        totalPromptTokens += res.promptTokens;
        totalCompletionTokens += res.completionTokens;
        totalTokens += res.totalTokens;
      } else {
        mediumFail++;
      }
    }

    const calcAvg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const calcMin = (arr) => (arr.length ? Math.min(...arr) : 0);
    const calcMax = (arr) => (arr.length ? Math.max(...arr) : 0);

    const allLatencies = [...lightLatencies, ...mediumLatencies];

    results[key] = {
      light: {
        successRate: (lightSuccess / 5) * 100,
        avgLatency: calcAvg(lightLatencies),
        avgTtfb: calcAvg(lightTtfbs),
      },
      medium: {
        successRate: (mediumSuccess / 5) * 100,
        avgLatency: calcAvg(mediumLatencies),
        avgTtfb: calcAvg(mediumTtfbs),
      },
      overall: {
        successRate: ((lightSuccess + mediumSuccess) / 10) * 100,
        avgLatency: calcAvg(allLatencies),
        minLatency: calcMin(allLatencies),
        maxLatency: calcMax(allLatencies),
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
      },
    };
  }

  return results;
};
