/**
 * @file models.js
 * @description Listagem de modelos disponíveis por chave ou arquivo de chaves.
 *
 * Aceita uma chave diretamente ou um arquivo .txt com múltiplas chaves.
 * Para arquivos, busca modelos apenas do primeiro key válido de cada
 * provider (mesmo provider = mesmo catálogo de modelos).
 *
 * Uso:
 *   npm run models -- <api-key>           (chave única)
 *   npm run models -- <path-to-file.txt>  (arquivo com chaves)
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import logger from "./utils/logger.js";
import OpenRouterProvider from "./providers/OpenRouterProvider.js";
import XaiProvider from "./providers/XaiProvider.js";
import GroqProvider from "./providers/GroqProvider.js";
import { detectProvider } from "./utils/keyDetector.js";

const cliArgument = process.argv[2];

/**
 * Instancia o provider correto com base no tipo detectado.
 *
 * @param {string} providerType - Tipo do provider.
 * @param {string} key - API key.
 * @returns {import('./providers/BaseProvider.js').default} Provider instanciado.
 */
const createProvider = (providerType, key) => {
  switch (providerType) {
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

/**
 * Busca e exibe os modelos disponíveis para uma chave específica.
 *
 * @param {string} key - API key para consultar.
 * @returns {Promise<object>} Resultado com chave mascarada, provider e lista de modelos.
 */
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

    modelList.sort((a, b) => a.id.localeCompare(b.id));

    for (const model of modelList) {
      const contextInfo = model.context_length
        ? ` | ctx: ${model.context_length.toLocaleString()}`
        : "";
      console.log(`  📦 ${model.id}${contextInfo}`);
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
  if (!cliArgument) {
    logger.error("Usage:");
    logger.info("  npm run models -- <api-key>           (single key)");
    logger.info("  npm run models -- <path-to-file.txt>  (one key per line)");
    process.exit(1);
  }

  const allResults = [];

  const filePath = path.resolve(cliArgument);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    logger.box("MODEL LISTING (Bulk)");
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const keys = [];
    for await (const line of rl) {
      const trimmedKey = line.trim();
      if (trimmedKey && !trimmedKey.startsWith("#")) keys.push(trimmedKey);
    }

    // Busca modelos apenas do primeiro key de cada provider
    // (mesmo provider compartilha o mesmo catálogo)
    const processedProviders = new Set();
    for (const key of keys) {
      const providerType = detectProvider(key);
      if (processedProviders.has(providerType)) {
        continue;
      }

      const result = await fetchModels(key);
      if (result.models.length > 0) {
        processedProviders.add(providerType);
        allResults.push(result);
      }
    }
  } else {
    logger.box("MODEL LISTING");
    const result = await fetchModels(cliArgument);
    allResults.push(result);
  }

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
