import OpenRouterProvider from './OpenRouterProvider.js';
import XaiProvider from './XaiProvider.js';
import GroqProvider from './GroqProvider.js';

export const providers = {
  openrouter: new OpenRouterProvider(),
  xai: new XaiProvider(),
  groq: new GroqProvider()
};
