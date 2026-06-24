/**
 * @file DropZone.jsx
 * @description Componente de upload (drag and drop) de arquivos .txt.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { UploadCloud } from "lucide-react";

export default function DropZone({
  isDragging,
  isProcessing,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  handleZoneClick,
  fileInputRef,
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight mb-6">
        Bulk Key Checker
      </h2>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleZoneClick}
        className={`vercel-card border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-all ${
          isDragging
            ? "border-[#0070F3] bg-[#0070F3]/5"
            : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
        }`}
      >
        <input
          type="file"
          multiple
          accept=".txt,text/plain"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />
        <UploadCloud
          className={`w-8 h-8 mb-4 ${
            isDragging ? "text-[#0070F3]" : "text-[var(--text-muted)]"
          }`}
        />
        <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
          {isProcessing
            ? "Checking keys across providers..."
            : "Click or drag and drop .txt files here"}
        </p>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Supports OpenRouter, Anthropic, Gemini, Groq, and xAI keys. Duplicates
          will be ignored.
        </p>
      </div>
    </section>
  );
}
