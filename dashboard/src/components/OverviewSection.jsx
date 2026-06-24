/**
 * @file OverviewSection.jsx
 * @description Componente com os cards de métricas gerais da verificação de chaves.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import StatItem from "./StatItem";

export default function OverviewSection({
  totalKeys,
  total,
  validKeys,
  invalidKeys,
  rateLimitedKeys,
  unknownQuotaKeys,
  totalBalance,
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 tracking-tight">
        Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 vercel-card">
        <StatItem
          title="Keys Checked"
          value={
            totalKeys > 0 ? `${total}/${totalKeys}` : total > 0 ? total : "—"
          }
          subtitle={
            total > 0
              ? `${validKeys} valid · ${invalidKeys} invalid`
              : "Drop a .txt to start"
          }
        />
        <StatItem
          title="Keys Valid"
          value={total > 0 ? validKeys : "—"}
          color={
            validKeys > 0 ? "text-[#50e3c2]" : "text-[var(--text-primary)]"
          }
          subtitle={total > 0 ? `${rateLimitedKeys} rate limited` : null}
        />
        <StatItem
          title="Confirmed Balance"
          value={total > 0 ? `$${totalBalance.toFixed(4)}` : "—"}
          subtitle={total > 0 ? "From available keys only" : null}
        />
        <StatItem
          title="Unknown Quota"
          value={total > 0 ? unknownQuotaKeys : "—"}
          color={
            unknownQuotaKeys > 0 ? "text-[#888]" : "text-[var(--text-primary)]"
          }
          subtitle={total > 0 ? `API did not provide limit data` : null}
        />
      </div>
    </section>
  );
}
