/**
 * @file index.js
 * @description Ponto central de exportação dos providers instanciados.
 *
 * Inicializa e exporta as instâncias dos providers que possuem API key
 * configurada no .env para serem utilizadas pelos serviços da aplicação.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import OpenRouterProvider from "./OpenRouterProvider.js";
import XaiProvider from "./XaiProvider.js";
import GroqProvider from "./GroqProvider.js";
import config from "../config/env.js";

export const providers = {
  openrouter: new OpenRouterProvider(),
  xai: new XaiProvider(),
  groq: new GroqProvider(),
};
