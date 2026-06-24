/**
 * @file Badges.jsx
 * @description Componentes visuais para exibição de status, quotas e health score.
 *
 * Utiliza cores padronizadas baseadas em status (valid, invalid, rate_limited, etc).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

export function KeyStatusBadge({ status }) {
  const s = status?.toLowerCase();

  const config = {
    valid: {
      classes: "bg-[#50e3c2]/10 text-[#50e3c2] border border-[#50e3c2]/30",
      dot: "bg-[#50e3c2]",
      label: "Valid",
    },
    invalid: {
      classes: "bg-[#E00]/10 text-[#E00] border border-[#E00]/30",
      dot: "bg-[#E00]",
      label: "Invalid",
    },
    restricted: {
      classes: "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30",
      dot: "bg-[#f5a623]",
      label: "Restricted",
    },
    rate_limited: {
      classes: "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30",
      dot: "bg-[#f5a623]",
      label: "Rate Limited",
    },
    unknown: {
      classes: "bg-[#888]/10 text-[#888] border border-[#888]/30",
      dot: "bg-[#888]",
      label: "Unknown",
    },
    error: {
      classes: "bg-[#E00]/10 text-[#E00] border border-[#E00]/30",
      dot: "bg-[#E00]",
      label: "Error",
    },
  };

  const { classes, dot, label } = config[s] || config.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
    </span>
  );
}

export function QuotaStatusBadge({ status }) {
  const s = status?.toLowerCase();

  const config = {
    available: {
      classes: "bg-[#50e3c2]/10 text-[#50e3c2] border border-[#50e3c2]/30",
      dot: "bg-[#50e3c2]",
      label: "Available",
    },
    unknown: {
      classes: "bg-[#888]/10 text-[#888] border border-[#888]/30",
      dot: "bg-[#888]",
      label: "Limits Unknown",
    },
    free_tier: {
      classes: "bg-[#0070F3]/10 text-[#0070F3] border border-[#0070F3]/30",
      dot: "bg-[#0070F3]",
      label: "Free Tier",
    },
    exhausted: {
      classes: "bg-[#E00]/10 text-[#E00] border border-[#E00]/30",
      dot: "bg-[#E00]",
      label: "Exhausted",
    },
  };

  const { classes, dot, label } = config[s] || config.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
    </span>
  );
}

export function HealthBadge({ score }) {
  const s = Number(score) || 0;
  let color = "text-[#E00]";
  if (s >= 90) color = "text-[#0070F3]";
  else if (s >= 70) color = "text-[#F5A623]";

  return (
    <span className={`text-[12px] font-mono ${color}`}>{s.toFixed(1)}/100</span>
  );
}
