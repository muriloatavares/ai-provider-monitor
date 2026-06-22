export const measureTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    ...result,
    totalLatency: end - start
  };
};
