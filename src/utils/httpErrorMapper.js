/**
 * @file httpErrorMapper.js
 * @description Traduz erros de chamadas HTTP (Axios) em objetos
 * padronizados de status para uso na validação de chaves.
 *
 * Extraído de api.js para permitir reuso e testabilidade independente.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

/**
 * Converte um erro Axios em um objeto padronizado com status da chave
 * e mensagem de erro legível.
 *
 * @param {import('axios').AxiosError} err - Erro capturado de uma chamada Axios.
 * @returns {{keyStatus: string, errorMsg: string}} Status mapeado da chave.
 */
export const mapAxiosErrorToStatus = (err) => {
  if (err.response) {
    const status = err.response.status;
    if (status === 401)
      return { keyStatus: "invalid", errorMsg: "Invalid Key (HTTP 401)" };
    if (status === 403)
      return {
        keyStatus: "restricted",
        errorMsg: "Permission Denied (HTTP 403)",
      };
    if (status === 429)
      return {
        keyStatus: "rate_limited",
        errorMsg: "Rate Limit Exceeded (HTTP 429)",
      };
    return {
      keyStatus: "error",
      errorMsg: err.response?.data?.error?.message || `HTTP ${status}`,
    };
  } else if (
    err.code === "ECONNABORTED" ||
    err.message.includes("timeout") ||
    err.code === "ENOTFOUND"
  ) {
    return { keyStatus: "unknown", errorMsg: "Connection Failed / Timeout" };
  }
  return { keyStatus: "error", errorMsg: err.message };
};
