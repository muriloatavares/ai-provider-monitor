/**
 * @file KeyRow.jsx
 * @description Componente de exibição de uma linha da tabela de chaves validadas.
 *
 * Expande para mostrar metadados detalhados (rate limits, modelos, custos).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Copy,
  Gauge,
  Cpu,
} from "lucide-react";
import { KeyStatusBadge, QuotaStatusBadge } from "./Badges";

export default function KeyRow({ r }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasModels = r.models && r.models.length > 0;
  const hasDetails =
    hasModels || r.metadata?.rateLimit || r.metadata?.usageDetails;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (r.fullKey) {
      navigator.clipboard.writeText(r.fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <>
      <tr
        className={`hover:bg-[var(--hover-bg)] transition-colors key-row-enter ${
          hasDetails ? "cursor-pointer" : ""
        }`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <td className="px-6 py-3 font-medium text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            {hasDetails &&
              (expanded ? (
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
              ))}
            {r.provider}
          </div>
        </td>
        <td className="px-6 py-3 font-mono text-[12px]">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <span>{r.key}</span>
            <button
              onClick={handleCopy}
              title="Copy full key"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-secondary)]"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#50e3c2]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </td>
        <td className="px-6 py-3">
          <KeyStatusBadge status={r.keyStatus} />
        </td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {hasModels ? (
            <span className="text-[var(--text-secondary)]">
              {r.models.length} models
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </td>
        <td className="px-6 py-3 text-right font-mono text-[var(--text-primary)]">
          <div className="flex items-center justify-end gap-2">
            <QuotaStatusBadge status={r.quotaStatus} />
            {r.balance !== null && (
              <span className="ml-1">${parseFloat(r.balance).toFixed(4)}</span>
            )}
            {r.metadata?.error && (
              <span
                className="text-[#E00] text-[11px] truncate max-w-[150px] inline-block ml-2"
                title={r.metadata.error}
              >
                {r.metadata.error}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {r.metadata?.rateLimit?.tokensRemaining &&
          r.metadata?.rateLimit?.tokensLimit ? (
            <span className="text-[#50e3c2]">
              {Number(r.metadata.rateLimit.tokensRemaining).toLocaleString()}
              <span className="text-[var(--text-muted)]">
                /{Number(r.metadata.rateLimit.tokensLimit).toLocaleString()}
              </span>
            </span>
          ) : r.metadata?.usageDetails?.dollarsUsed !== undefined ? (
            <span className="text-[var(--text-secondary)]">
              ${r.metadata.usageDetails.dollarsUsed.toFixed(4)} spent
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="px-0 py-0 bg-[var(--bg-card)]">
            <div className="px-10 py-4 border-t border-[var(--border-secondary)] space-y-4">
              {/* Rate Limits & Usage */}
              {(r.metadata?.rateLimit || r.metadata?.usageDetails) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                      Limits & Usage Data
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {r.metadata.usageDetails && (
                      <>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                            Dollars Used
                          </p>
                          <p className="text-[13px] font-mono text-[var(--text-primary)]">
                            $
                            {r.metadata.usageDetails.dollarsUsed?.toFixed(4) ||
                              "0"}
                          </p>
                        </div>
                        {r.metadata.usageDetails.dollarsLimit !== null && (
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              Spending Limit
                            </p>
                            <p className="text-[13px] font-mono text-[var(--text-primary)]">
                              $
                              {r.metadata.usageDetails.dollarsLimit?.toFixed(4)}
                            </p>
                          </div>
                        )}
                        {r.metadata.usageDetails.label && (
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              Key Label
                            </p>
                            <p className="text-[13px] font-mono text-[var(--text-primary)]">
                              {r.metadata.usageDetails.label}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {r.metadata.rateLimit?.tokensLimit && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Token Limit
                        </p>
                        <p className="text-[13px] font-mono text-[var(--text-primary)]">
                          {Number(
                            r.metadata.rateLimit.tokensLimit,
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.tokensRemaining && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Tokens Remaining
                        </p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">
                          {Number(
                            r.metadata.rateLimit.tokensRemaining,
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.requestsLimit && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Requests Limit
                        </p>
                        <p className="text-[13px] font-mono text-[var(--text-primary)]">
                          {r.metadata.rateLimit.requestsLimit}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.requestsRemaining && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Requests Left
                        </p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">
                          {r.metadata.rateLimit.requestsRemaining}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Models */}
              {hasModels && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                      Available Models ({r.models.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.models.map((m) => (
                      <span
                        key={m.id}
                        className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-2 py-1 rounded hover:border-[var(--border-secondary)] transition-colors"
                      >
                        {m.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
