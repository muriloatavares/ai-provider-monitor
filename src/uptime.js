import fs from "fs";
import path from "path";
import logger from "./utils/logger.js";
import { validateEnv } from "./config/env.js";
import config from "./config/env.js";
import { providers } from "./providers/index.js";

const UPTIME_FILE = path.resolve("reports", "uptime.json");
const INTERVAL_MS = parseInt(process.env.UPTIME_INTERVAL_MS, 10) || 60000; // Default: 1 min

// Map provider keys to their corresponding env config keys
const providerKeyMap = {
  openrouter: "OPENROUTER_API_KEY",
  xai: "XAI_API_KEY",
  groq: "GROQ_API_KEY",
};

const getActiveProviders = () => {
  return Object.keys(providers).filter((name) => {
    const envKey = providerKeyMap[name];
    return envKey && config[envKey];
  });
};

/** Load existing uptime history from disk */
const loadHistory = () => {
  try {
    if (fs.existsSync(UPTIME_FILE)) {
      return JSON.parse(fs.readFileSync(UPTIME_FILE, "utf-8"));
    }
  } catch {
    // Corrupted file — start fresh
  }
  return {};
};

/** Save uptime history to disk */
const saveHistory = (history) => {
  const dir = path.dirname(UPTIME_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(UPTIME_FILE, JSON.stringify(history, null, 2));
};

/** Calculate uptime stats from check records */
const calculateStats = (checks) => {
  if (!checks || checks.length === 0) {
    return {
      uptimePercent: 0,
      totalChecks: 0,
      successChecks: 0,
      failChecks: 0,
      avgLatency: 0,
    };
  }

  const total = checks.length;
  const successes = checks.filter((c) => c.online).length;
  const fails = total - successes;
  const latencies = checks.filter((c) => c.latency > 0).map((c) => c.latency);
  const avgLatency =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  // Time-window based stats
  const now = Date.now();
  const last1h = checks.filter(
    (c) => now - new Date(c.timestamp).getTime() < 3600000,
  );
  const last24h = checks.filter(
    (c) => now - new Date(c.timestamp).getTime() < 86400000,
  );

  const uptimeAll = (successes / total) * 100;
  const uptime1h =
    last1h.length > 0
      ? (last1h.filter((c) => c.online).length / last1h.length) * 100
      : null;
  const uptime24h =
    last24h.length > 0
      ? (last24h.filter((c) => c.online).length / last24h.length) * 100
      : null;

  return {
    uptimePercent: parseFloat(uptimeAll.toFixed(2)),
    uptime1h: uptime1h !== null ? parseFloat(uptime1h.toFixed(2)) : null,
    uptime24h: uptime24h !== null ? parseFloat(uptime24h.toFixed(2)) : null,
    totalChecks: total,
    successChecks: successes,
    failChecks: fails,
    avgLatency: Math.round(avgLatency),
    firstCheck: checks[0]?.timestamp,
    lastCheck: checks[checks.length - 1]?.timestamp,
  };
};

/** Run a single check cycle */
const runCheck = async (activeProviders, history) => {
  const timestamp = new Date().toISOString();

  for (const name of activeProviders) {
    const provider = providers[name];

    if (!history[name]) {
      history[name] = { checks: [] };
    }

    const start = performance.now();
    let online = false;
    let error = null;

    try {
      const auth = await provider.checkAuth();
      online = auth.online;
      if (!online) error = auth.error;
    } catch (err) {
      error = err.message;
    }

    const latency = performance.now() - start;

    history[name].checks.push({
      timestamp,
      online,
      latency: Math.round(latency),
      error: error || null,
    });

    // Keep only last 1440 checks (~24h at 1min interval) to avoid bloat
    if (history[name].checks.length > 1440) {
      history[name].checks = history[name].checks.slice(-1440);
    }

    // Recalculate stats
    history[name].stats = calculateStats(history[name].checks);

    // Log
    const statusIcon = online ? "🟢" : "🔴";
    const uptimeStr = history[name].stats.uptimePercent.toFixed(2);
    logger.info(
      `${statusIcon} ${name.toUpperCase()} | Status: ${online ? "UP" : "DOWN"} | Latency: ${Math.round(latency)} ms | Uptime: ${uptimeStr}%`,
    );
  }

  saveHistory(history);
};

/** Print summary dashboard */
const printDashboard = (activeProviders, history) => {
  logger.box("UPTIME DASHBOARD");

  for (const name of activeProviders) {
    const data = history[name];
    if (!data || !data.stats) continue;

    const s = data.stats;
    const bar = generateBar(s.uptimePercent);

    logger.header(name.toUpperCase());
    logger.info(`Uptime (all time): ${bar} ${s.uptimePercent}%`);
    if (s.uptime1h !== null) logger.info(`Uptime (1h):       ${s.uptime1h}%`);
    if (s.uptime24h !== null) logger.info(`Uptime (24h):      ${s.uptime24h}%`);
    logger.info(
      `Total Checks:      ${s.totalChecks} (✔ ${s.successChecks} | ✖ ${s.failChecks})`,
    );
    logger.info(`Avg Latency:       ${s.avgLatency} ms`);
    logger.info(`Monitoring Since:  ${s.firstCheck || "N/A"}`);
    logger.info(`Last Check:        ${s.lastCheck || "N/A"}`);
  }
};

/** Generate a visual progress bar */
const generateBar = (percent) => {
  const filled = Math.round(percent / 5); // 20 chars = 100%
  const empty = 20 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
};

/** Main */
const main = async () => {
  validateEnv();
  const activeProviders = getActiveProviders();

  if (activeProviders.length === 0) {
    logger.error("No providers configured. Set at least one API key in .env");
    process.exit(1);
  }

  const mode = process.argv[2];
  const history = loadHistory();

  if (mode === "--once" || mode === "-1") {
    // Single check mode
    logger.box("UPTIME CHECK (Single)");
    await runCheck(activeProviders, history);
    printDashboard(activeProviders, history);
    return;
  }

  if (mode === "--status" || mode === "-s") {
    // Just show current stats without pinging
    if (Object.keys(history).length === 0) {
      logger.warn(
        "No uptime data yet. Run a check first: npm run uptime -- --once",
      );
      return;
    }
    printDashboard(activeProviders, history);
    return;
  }

  // Continuous monitoring mode
  logger.box(`UPTIME MONITOR (every ${INTERVAL_MS / 1000}s)`);
  logger.info(`Monitoring: ${activeProviders.join(", ")}`);
  logger.info("Press Ctrl+C to stop.\n");

  // Run immediately
  await runCheck(activeProviders, history);

  // Then repeat on interval
  setInterval(async () => {
    const freshHistory = loadHistory();
    await runCheck(activeProviders, freshHistory);
  }, INTERVAL_MS);
};

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
