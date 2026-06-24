/**
 * @file ProviderSummary.jsx
 * @description Cards analíticos agregados por provider.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

export default function ProviderSummary({ results, providerStats }) {
  if (
    !results ||
    results.length === 0 ||
    Object.keys(providerStats).length === 0
  ) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight mb-6">
        Provider Summary
      </h2>
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(
          Object.keys(providerStats).length,
          3,
        )} gap-6`}
      >
        {Object.entries(providerStats).map(([name, stats]) => (
          <div key={name} className="vercel-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {name}
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  stats.invalid === 0
                    ? "border-[#50e3c2]/30 text-[#50e3c2] bg-[#50e3c2]/5"
                    : "border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/5"
                }`}
              >
                {stats.valid}/{stats.total} valid
              </span>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Valid</span>
                <span className="text-[#50e3c2] font-mono">{stats.valid}</span>
              </div>
              {stats.rate_limited > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Rate Limited
                  </span>
                  <span className="text-[#f5a623] font-mono">
                    {stats.rate_limited}
                  </span>
                </div>
              )}
              {stats.restricted > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Restricted
                  </span>
                  <span className="text-[#f5a623] font-mono">
                    {stats.restricted}
                  </span>
                </div>
              )}
              {stats.invalid > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Invalid/Error
                  </span>
                  <span className="text-[#e00] font-mono">
                    {stats.invalid + stats.error}
                  </span>
                </div>
              )}
              {stats.unknownQuota > 0 && (
                <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 mt-2">
                  <span className="text-[var(--text-secondary)]">
                    Unknown Limits
                  </span>
                  <span className="text-[#888] font-mono">
                    {stats.unknownQuota}
                  </span>
                </div>
              )}
              {stats.balance > 0 && (
                <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 mt-2">
                  <span className="text-[var(--text-secondary)]">
                    Confirmed Balance
                  </span>
                  <span className="text-[var(--text-primary)] font-mono font-medium">
                    ${stats.balance.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
