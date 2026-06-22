import express from 'express';
import config from './config/env.js';
import { runHealthCheck } from './services/healthCheck.js';
import { runBenchmark } from './services/benchmark.js';
import { saveLatest, saveBenchmark, saveHistory } from './utils/exporter.js';

const app = express();

let latestHealth = null;
let latestBenchmark = null;

// Cache updates every time the CLI runs
export const updateApiState = (health, benchmark) => {
  latestHealth = health;
  latestBenchmark = benchmark;
};

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/providers', async (req, res) => {
  // If we have cached data, return it, otherwise run it
  if (!latestHealth) {
    latestHealth = await runHealthCheck();
  }
  const providersStatus = {};
  for (const [key, data] of Object.entries(latestHealth)) {
    providersStatus[key] = { online: data.online };
  }
  res.json(providersStatus);
});

app.get('/benchmark', async (req, res) => {
  if (!latestBenchmark) {
    latestBenchmark = await runBenchmark();
  }
  res.json(latestBenchmark);
});

export const startApi = () => {
  app.listen(config.PORT, () => {
    // console.log(`API Server running on port ${config.PORT}`);
  });
};
