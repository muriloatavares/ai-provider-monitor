/**
 * @file bulk.js
 * @description Verificador de chaves em massa via linha de comando.
 *
 * Lê um arquivo .txt com uma chave por linha, detecta o provider
 * automaticamente pelo prefixo, e valida cada chave em sequência.
 *
 * Uso: npm run bulk -- <path-to-keys-file>
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
import { formatCurrency } from "./utils/formatter.js";

const KEY_FILE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("keys.txt");

/**
 * Instancia o provider correto para validação de uma chave individual.
 *
 * @param {string} providerType - Tipo do provider (openrouter, xai, groq).
 * @param {string} key - API key para autenticação.
 * @returns {import('./providers/BaseProvider.js').default} Instância do provider.
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

const main = async () => {
  if (!fs.existsSync(KEY_FILE)) {
    logger.error(`File not found: ${KEY_FILE}`);
    logger.info("Usage: npm run bulk -- <path-to-keys-file>");
    logger.info("Or create a keys.txt file in the project root.");
    process.exit(1);
  }

  logger.info(`Reading keys from: ${KEY_FILE}\n`);

  const fileStream = fs.createReadStream(KEY_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const keys = [];
  for await (const line of rl) {
    const trimmedKey = line.trim();
    if (trimmedKey && !trimmedKey.startsWith("#")) {
      keys.push(trimmedKey);
    }
  }

  logger.box(`BULK KEY CHECKER - Found ${keys.length} keys`);

  const summary = { valid: 0, invalid: 0, totalCredits: 0 };
  const exportData = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const providerType = detectProvider(key);

    logger.header(`[${i + 1}/${keys.length}] Checking Key (${providerType})`);
    const provider = createProvider(providerType, key);

    const maskedKey = `${key.slice(0, 8)}...${key.slice(-4)}`;
    const auth = await provider.checkAuth();

    if (auth.online) {
      summary.valid++;
      const balance = await provider.getBalance();

      let creditInfo = balance.summary || "N/A";
      if (!balance.summary && typeof balance.credits === "number") {
        creditInfo = formatCurrency(balance.credits);
      }
      if (typeof balance.credits === "number") {
        summary.totalCredits += balance.credits;
      }

      logger.success(
        `VALID: ${maskedKey} | Provider: ${providerType} | Models: ${auth.modelCount} | ${creditInfo}`,
      );

      exportData.push({
        key: maskedKey,
        provider: providerType,
        status: "VALID",
        models: auth.modelCount,
        credits: balance.credits,
        usage: balance.usage ?? null,
        limit: balance.limit ?? null,
        isFreeTier: balance.isFreeTier ?? null,
      });
    } else {
      summary.invalid++;
      logger.error(
        `INVALID: ${maskedKey} | Provider: ${providerType} | Error: ${auth.error}`,
      );

      exportData.push({
        key: maskedKey,
        provider: providerType,
        status: "INVALID",
        error: auth.error,
      });
    }
  }

  logger.box("BULK SUMMARY");
  logger.info(`Total Keys Checked: ${keys.length}`);
  logger.success(`Valid: ${summary.valid}`);
  logger.error(`Invalid: ${summary.invalid}`);
  if (summary.totalCredits > 0) {
    logger.success(
      `Total Account Credits Value: ${formatCurrency(summary.totalCredits)}`,
    );
  }

  const reportsDir = path.resolve("reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "bulk_report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalChecked: keys.length,
        valid: summary.valid,
        invalid: summary.invalid,
        results: exportData,
      },
      null,
      2,
    ),
  );
  logger.info(`\nDetailed report saved to: ${reportPath}`);
};

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
