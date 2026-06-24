import dotenv from "dotenv";
dotenv.config();

const config = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/auto",
  XAI_API_KEY: process.env.XAI_API_KEY,
  XAI_MODEL: process.env.XAI_MODEL || "grok-beta",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  TIMEOUT_MS: parseInt(process.env.TIMEOUT_MS, 10) || 15000,
  PORT: parseInt(process.env.PORT, 10) || 3000,
};

export const validateEnv = () => {
  const allKeys = [
    { name: "OPENROUTER_API_KEY", value: config.OPENROUTER_API_KEY },
    { name: "XAI_API_KEY", value: config.XAI_API_KEY },
    { name: "GROQ_API_KEY", value: config.GROQ_API_KEY },
  ];

  const missing = allKeys.filter((k) => !k.value).map((k) => k.name);
  const present = allKeys.filter((k) => k.value).map((k) => k.name);

  if (present.length === 0) {
    console.warn(
      "No API keys configured in .env. Starting in Bulk Checker mode.",
    );
  }

  if (missing.length > 0) {
    console.warn(
      `⚠ Optional keys not set (those providers will be skipped): ${missing.join(", ")}`,
    );
  }
};

export const maskKey = (key) => {
  if (!key) return "N/A";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export default config;
