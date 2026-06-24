/**
 * @file exporter.js
 * @description Utilitário para exportar relatórios JSON.
 *
 * Gerencia a gravação de arquivos de relatórios como latest.json,
 * benchmark.json e o histórico completo em reports/history/.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import fs from "fs";
import path from "path";

const reportsDir = path.resolve("reports");
const historyDir = path.join(reportsDir, "history");

// Ensure directories exist
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

/**
 * Salva o relatório consolidado mais recente sobrescrevendo o arquivo anterior.
 *
 * @param {object} data - Relatório completo a ser salvo.
 */
export const saveLatest = (data) => {
  fs.writeFileSync(
    path.join(reportsDir, "latest.json"),
    JSON.stringify(data, null, 2),
  );
};

/**
 * Salva os resultados detalhados do último benchmark executado.
 *
 * @param {object} data - Dados de resultados do benchmark.
 */
export const saveBenchmark = (data) => {
  fs.writeFileSync(
    path.join(reportsDir, "benchmark.json"),
    JSON.stringify(data, null, 2),
  );
};

/**
 * Salva um snapshot histórico com base no timestamp atual.
 *
 * @param {object} data - Relatório completo a ser guardado no histórico.
 */
export const saveHistory = (data) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(
    path.join(historyDir, `${timestamp}.json`),
    JSON.stringify(data, null, 2),
  );
};
