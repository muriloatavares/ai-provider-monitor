/**
 * @file timer.js
 * @description Utilitário para medição de tempo de execução (latência).
 *
 * Permite envolver qualquer função assíncrona para mensurar o tempo exato
 * que ela leva para retornar.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

/**
 * Mede a latência total da execução de uma função assíncrona.
 * Retorna o resultado original da função mesclado com a latência aferida.
 *
 * @param {function(): Promise<object>} fn - Função assíncrona a ser medida.
 * @returns {Promise<object>} Objeto contendo o resultado da função e 'totalLatency' em ms.
 */
export const measureTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    ...result,
    totalLatency: end - start,
  };
};
