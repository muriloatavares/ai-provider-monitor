import fs from "fs";
import path from "path";

const reportsDir = path.resolve("reports");
const historyDir = path.join(reportsDir, "history");

// Ensure directories exist
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

export const saveLatest = (data) => {
  fs.writeFileSync(
    path.join(reportsDir, "latest.json"),
    JSON.stringify(data, null, 2),
  );
};

export const saveBenchmark = (data) => {
  fs.writeFileSync(
    path.join(reportsDir, "benchmark.json"),
    JSON.stringify(data, null, 2),
  );
};

export const saveHistory = (data) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(
    path.join(historyDir, `${timestamp}.json`),
    JSON.stringify(data, null, 2),
  );
};
