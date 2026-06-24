/**
 * @file StatItem.jsx
 * @description Componente de exibição de estatísticas simplificadas.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

export default function StatItem({ title, value, subtitle, color }) {
  return (
    <div className="flex flex-col">
      <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-2">
        {title}
      </p>
      <h3
        className={`text-3xl font-light tracking-tight ${
          color || "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-[var(--text-muted)] mt-2">{subtitle}</p>
      )}
    </div>
  );
}
