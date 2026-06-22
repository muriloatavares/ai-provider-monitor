import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { validateEnv } from '../config/env.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import tokenTracker from '../utils/tokenTracker.js';
import pricingEngine from '../services/pricingEngine.js';
import providerTracker from '../services/providerTracker.js';

const REPORT_FILE = path.resolve('reports', 'streaming_benchmark.json');

const providersConfig = [
  { name: 'openrouter', url: 'https://openrouter.ai/api/v1', key: config.OPENROUTER_API_KEY, model: config.OPENROUTER_MODEL },
  { name: 'xai', url: 'https://api.x.ai/v1', key: config.XAI_API_KEY, model: config.XAI_MODEL },
  { name: 'groq', url: 'https://api.groq.com/openai/v1', key: config.GROQ_API_KEY, model: config.GROQ_MODEL }
];

class StreamingBenchmark {
  constructor() {
    this.results = [];
  }

  async runStream(providerName, url, key, model, prompt = "Escreva um parágrafo sobre a história do JavaScript.") {
    const startTime = performance.now();
    let firstByteTime = null;
    let firstTokenTime = null;
    let completionLength = 0;
    let chunksCount = 0;
    let totalChunkSize = 0;
    
    try {
      const response = await axios.post(`${url}/chat/completions`, {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      }, {
        headers: { 'Authorization': `Bearer ${key}` },
        responseType: 'stream'
      });

      // TTFB: Time To First Byte (when the response stream starts)
      firstByteTime = performance.now();
      const ttfb = firstByteTime - startTime;
      
      // Extract underlying provider headers if any
      const headers = response.headers;
      let underlyingProvider = providerName;
      if (headers['x-openrouter-provider']) {
        underlyingProvider = headers['x-openrouter-provider'];
      }

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          if (!firstTokenTime) {
            firstTokenTime = performance.now();
          }
          
          const chunkStr = chunk.toString('utf8');
          chunksCount++;
          totalChunkSize += chunk.length;

          // Process SSE lines
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') continue;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                completionLength += content.length;
              } catch (e) {
                // Ignore incomplete JSON chunks from streams
              }
            }
          }
        });

        response.data.on('end', () => {
          const endTime = performance.now();
          const totalLatency = endTime - startTime;
          const streamDuration = endTime - (firstTokenTime || firstByteTime);
          
          const ttft = (firstTokenTime || endTime) - startTime;
          const tps = completionLength > 0 && streamDuration > 0 ? (completionLength / 4) / (streamDuration / 1000) : 0; // Estimation: 1 token = 4 chars
          const charactersPerSecond = streamDuration > 0 ? completionLength / (streamDuration / 1000) : 0;
          const avgChunkSize = chunksCount > 0 ? totalChunkSize / chunksCount : 0;

          // Track infrastructure if possible
          providerTracker.track(providerName, model, totalLatency, ttfb, response.status, headers);

          resolve({
            provider: providerName,
            model: model,
            underlyingProvider,
            ttfb: Math.round(ttfb),
            ttft: Math.round(ttft),
            tps: parseFloat(tps.toFixed(2)),
            charactersPerSecond: parseFloat(charactersPerSecond.toFixed(2)),
            latency: Math.round(totalLatency),
            completionLength,
            averageChunkSize: Math.round(avgChunkSize),
            totalChunks: chunksCount
          });
        });

        response.data.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      return {
        provider: providerName,
        model: model,
        error: error.response?.status ? `HTTP ${error.response.status}` : error.message
      };
    }
  }

  saveReport() {
    const dir = path.dirname(REPORT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REPORT_FILE, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));
    logger.info(`\nStreaming benchmark report saved to: ${REPORT_FILE}`);
  }

  async runAll() {
    validateEnv();
    await pricingEngine.updatePricing();

    logger.box('STREAMING OBSERVABILITY BENCHMARK');
    logger.info('Measuring TTFB, TTFT, and TPS using stream:true...\n');

    const activeProviders = providersConfig.filter(p => p.key);

    if (activeProviders.length === 0) {
      logger.error('No API keys configured.');
      process.exit(1);
    }

    for (const provider of activeProviders) {
      logger.header(provider.name.toUpperCase());
      const result = await this.runStream(provider.name, provider.url, provider.key, provider.model);
      
      if (result.error) {
        logger.error(`Failed: ${result.error}`);
        this.results.push(result);
        continue;
      }

      logger.success(`Model: ${result.model}`);
      if (result.underlyingProvider !== result.provider) {
        logger.info(`Infrastructure: ${result.underlyingProvider}`);
      }
      logger.info(`TTFB: ${result.ttfb} ms`);
      logger.info(`TTFT: ${result.ttft} ms`);
      logger.info(`Total Latency: ${result.latency} ms`);
      logger.info(`Characters/Sec: ${result.charactersPerSecond}`);
      logger.info(`Est. TPS: ~${result.tps}`);
      logger.info(`Chunks: ${result.totalChunks} (Avg Size: ${result.averageChunkSize} bytes)`);

      this.results.push(result);
    }

    this.saveReport();
  }
}

const benchmark = new StreamingBenchmark();
benchmark.runAll().catch(err => {
  logger.error(err.message);
  process.exit(1);
});
