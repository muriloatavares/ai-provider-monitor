export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "NOT AVAILABLE")
    return "NOT AVAILABLE";
  return `$${parseFloat(value).toFixed(4)}`;
};

export const formatMs = (ms) => {
  if (ms === null || ms === undefined) return "N/A";
  return `${Math.round(ms)} ms`;
};
