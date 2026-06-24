import fs from "fs";
import path from "path";
import readline from "readline";
import logger from "./utils/logger.js";
import OpenRouterProvider from "./providers/OpenRouterProvider.js";
import XaiProvider from "./providers/XaiProvider.js";
import GroqProvider from "./providers/GroqProvider.js";

// Accept a single key as argument, or a file path
const arg = process.argv[2];

const detectProvider = (key) => {
  if (key.startsWith("sk-or-v1-")) return "openrouter";
  if (key.startsWith("xai-")) return "xai";
  if (key.startsWith("gsk_")) return "groq";
  return "openrouter";
};

const createProvider = (type, key) => {
  switch (type) {
    case "openrouter":
      return new OpenRouterProvider(key);
    case "xai":
      return new XaiProvider(key);
    case "groq":
      return new GroqProvider(key);
    default:
      return new OpenRouterProvider(key);
  }
};

const fetchModels = async (key) => {
  const providerType = detectProvider(key);
  const provider = createProvider(providerType, key);
  const maskedKey = `${key.slice(0, 8)}...${key.slice(-4)}`;

  logger.header(`Key: ${maskedKey} (${providerType})`);

  try {
    const res = await provider.client.get("/models");
    const models = res.data?.data || [];

    if (models.length === 0) {
      logger.warn("No models found for this key.");
      return { key: maskedKey, provider: providerType, models: [] };
    }

    logger.success(`${models.length} models available:\n`);

    const modelList = models.map((m) => ({
      id: m.id,
      name: m.name || m.id,
      owned_by: m.owned_by || "unknown",
      context_length: m.context_length || m.context_window || null,
    }));

    // Sort alphabetically by id
    modelList.sort((a, b) => a.id.localeCompare(b.id));

    // Display as a clean table
    for (const model of modelList) {
      const ctx = model.context_length
        ? ` | ctx: ${model.context_length.toLocaleString()}`
        : "";
      console.log(`  📦 ${model.id}${ctx}`);
    }

    return { key: maskedKey, provider: providerType, models: modelList };
  } catch (error) {
    const errMsg = error.response?.status
      ? `HTTP ${error.response.status}`
      : error.message;
    logger.error(`Failed to fetch models: ${errMsg}`);
    return {
      key: maskedKey,
      provider: providerType,
      error: errMsg,
      models: [],
    };
  }
};

const main = async () => {
  if (!arg) {
    logger.error("Usage:");
    logger.info("  npm run models -- <api-key>           (single key)");
    logger.info("  npm run models -- <path-to-file.txt>  (one key per line)");
    process.exit(1);
  }

  const allResults = [];

  // Check if the argument is a file
  const filePath = path.resolve(arg);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    logger.box("MODEL LISTING (Bulk)");
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const keys = [];
    for await (const line of rl) {
      const key = line.trim();
      if (key && !key.startsWith("#")) keys.push(key);
    }

    // Only fetch models for the first valid key of each provider type
    // (all keys of the same provider share the same model catalog)
    const seen = new Set();
    for (const key of keys) {
      const type = detectProvider(key);
      if (seen.has(type)) {
        continue; // Same provider, same models — skip
      }

      const result = await fetchModels(key);
      if (result.models.length > 0) {
        seen.add(type);
        allResults.push(result);
      }
    }
  } else {
    // Single key mode
    logger.box("MODEL LISTING");
    const result = await fetchModels(arg);
    allResults.push(result);
  }

  // Export
  const reportsDir = path.resolve("reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "models_report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results: allResults,
      },
      null,
      2,
    ),
  );
  logger.info(`\nModels report saved to: ${reportPath}`);
};

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
