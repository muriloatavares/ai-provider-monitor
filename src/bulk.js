import fs from "fs";
import path from "path";
import readline from "readline";
import logger from "./utils/logger.js";
import OpenRouterProvider from "./providers/OpenRouterProvider.js";
import XaiProvider from "./providers/XaiProvider.js";
import GroqProvider from "./providers/GroqProvider.js";
import { formatCurrency } from "./utils/formatter.js";

// Accept file path as CLI argument, or default to keys.txt
const KEY_FILE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("keys.txt");

const detectProvider = (key) => {
  if (key.startsWith("sk-or-v1-")) return "openrouter";
  if (key.startsWith("xai-")) return "xai";
  if (key.startsWith("gsk_")) return "groq";
  // Fallback: try as openrouter
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
    const key = line.trim();
    if (key && !key.startsWith("#")) {
      keys.push(key);
    }
  }

  logger.box(`BULK KEY CHECKER - Found ${keys.length} keys`);

  const results = { valid: 0, invalid: 0, totalCredits: 0 };
  const exportData = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const providerType = detectProvider(key);

    logger.header(`[${i + 1}/${keys.length}] Checking Key (${providerType})`);
    const provider = createProvider(providerType, key);

    // Mask Key for display — never expose full keys
    const maskedKey = `${key.slice(0, 8)}...${key.slice(-4)}`;

    const auth = await provider.checkAuth();

    if (auth.online) {
      results.valid++;
      const balance = await provider.getBalance();

      // Use the summary field if available, otherwise format credits
      let creditInfo = balance.summary || "N/A";
      if (!balance.summary && typeof balance.credits === "number") {
        creditInfo = formatCurrency(balance.credits);
      }
      if (typeof balance.credits === "number") {
        results.totalCredits += balance.credits;
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
      results.invalid++;
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
  logger.success(`Valid: ${results.valid}`);
  logger.error(`Invalid: ${results.invalid}`);
  if (results.totalCredits > 0) {
    logger.success(
      `Total Account Credits Value: ${formatCurrency(results.totalCredits)}`,
    );
  }

  // Save bulk report
  const reportsDir = path.resolve("reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "bulk_report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalChecked: keys.length,
        valid: results.valid,
        invalid: results.invalid,
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
