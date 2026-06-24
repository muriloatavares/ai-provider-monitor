/**
 * @file ResultsTable.jsx
 * @description Tabela de exibição de chaves em tempo real (streaming).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  XCircle,
} from "lucide-react";
import KeyRow from "./KeyRow";
import SkeletonRow from "./SkeletonRow";

export default function ResultsTable({
  results,
  total,
  totalKeys,
  isProcessing,
  validKeys,
  rateLimitedKeys,
  restrictedKeys,
  unknownQuotaKeys,
  invalidKeys,
  skeletonsToRender,
}) {
  if (results === null && totalKeys === 0) return null;

  return (
    <section>
      <div className="vercel-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-card)]">
          <div>
            <h3 className="text-[13px] font-medium text-[var(--text-primary)]">
              Checked Keys ({total})
            </h3>
            {isProcessing && totalKeys > 0 && (
              <div className="w-48 h-1.5 bg-[var(--bg-secondary)] rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#0070F3] transition-all duration-300"
                  style={{ width: `${(total / totalKeys) * 100}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-4 text-[12px]">
            <span className="text-[#50e3c2] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {validKeys} Valid
            </span>
            {rateLimitedKeys > 0 && (
              <span className="text-[#f5a623] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {rateLimitedKeys} Rate
                Limited
              </span>
            )}
            {restrictedKeys > 0 && (
              <span className="text-[#f5a623] flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {restrictedKeys} Restricted
              </span>
            )}
            {unknownQuotaKeys > 0 && (
              <span className="text-[#888] flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {unknownQuotaKeys} Unknown
                Limits
              </span>
            )}
            <span className="text-[#E00] flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {invalidKeys} Invalid
            </span>
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-[13px] text-[var(--text-secondary)]">
            <thead className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">Provider</th>
                <th className="px-6 py-3 font-medium">Key Prefix</th>
                <th className="px-6 py-3 font-medium">Key Status</th>
                <th className="px-6 py-3 font-medium text-right">Models</th>
                <th className="px-6 py-3 font-medium text-right">
                  Limits Status
                </th>
                <th className="px-6 py-3 font-medium text-right">
                  Tokens Used
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {results &&
                results.map((r, idx) => (
                  <KeyRow key={`${r.fullKey}-${idx}`} r={r} />
                ))}
              {Array.from({ length: skeletonsToRender }).map((_, i) => (
                <SkeletonRow key={`skel-${i}`} />
              ))}
              {isProcessing && totalKeys - total > 10 && (
                <tr className="bg-[var(--bg-card)]">
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-[12px] text-[var(--text-muted)] animate-pulse"
                  >
                    + {totalKeys - total - 10} chaves pendentes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
