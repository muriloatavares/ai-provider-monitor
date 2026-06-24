/**
 * @file formatter.js
 * @description Funções utilitárias para formatação de dados em strings legíveis.
 *
 * Provê formatação consistente de moedas e tempos (ms).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

/**
 * Formata um valor numérico como moeda em dólares (USD) com 4 casas decimais.
 *
 * @param {number|string|null} value - O valor a ser formatado.
 * @returns {string} String formatada (ex: "$0.0015") ou "NOT AVAILABLE".
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "NOT AVAILABLE")
    return "NOT AVAILABLE";
  return `$${parseFloat(value).toFixed(4)}`;
};

export const formatMs = (ms) => {
  if (ms === null || ms === undefined) return "N/A";
  return `${Math.round(ms)} ms`;
};
