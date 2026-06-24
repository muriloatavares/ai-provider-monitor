import React from "react";

export default function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-card)]">
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--border-primary)] rounded w-24 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--border-primary)] rounded w-48 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-[var(--border-primary)] rounded-full w-16 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--border-primary)] rounded w-12 ml-auto animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--border-primary)] rounded w-16 ml-auto animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--border-primary)] rounded w-20 ml-auto animate-pulse"></div>
      </td>
    </tr>
  );
}
