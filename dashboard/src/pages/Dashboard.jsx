/**
 * @file Dashboard.jsx
 * @description Página principal do Bulk Key Checker.
 *
 * Reduzida de 716 linhas para ~50 linhas ao extrair a lógica
 * para useKeyChecker e os componentes visuais para arquivos dedicados.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { useKeyChecker } from "../hooks/useKeyChecker";
import OverviewSection from "../components/OverviewSection";
import DropZone from "../components/DropZone";
import ResultsTable from "../components/ResultsTable";
import ProviderSummary from "../components/ProviderSummary";

export default function Dashboard() {
  const {
    isDragging,
    isProcessing,
    results,
    totalKeys,
    total,
    validKeys,
    invalidKeys,
    restrictedKeys,
    rateLimitedKeys,
    unknownQuotaKeys,
    exhaustedKeys,
    freeTierKeys,
    availableKeys,
    totalBalance,
    providerStats,
    fileInputRef,
    skeletonsToRender,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInputChange,
    handleZoneClick,
  } = useKeyChecker();

  return (
    <div className="space-y-12">
      <OverviewSection
        totalKeys={totalKeys}
        total={total}
        validKeys={validKeys}
        invalidKeys={invalidKeys}
        rateLimitedKeys={rateLimitedKeys}
        unknownQuotaKeys={unknownQuotaKeys}
        totalBalance={totalBalance}
      />

      <DropZone
        isDragging={isDragging}
        isProcessing={isProcessing}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onFileInputChange={onFileInputChange}
        handleZoneClick={handleZoneClick}
        fileInputRef={fileInputRef}
      />

      <ResultsTable
        results={results}
        total={total}
        totalKeys={totalKeys}
        isProcessing={isProcessing}
        validKeys={validKeys}
        rateLimitedKeys={rateLimitedKeys}
        restrictedKeys={restrictedKeys}
        unknownQuotaKeys={unknownQuotaKeys}
        invalidKeys={invalidKeys}
        skeletonsToRender={skeletonsToRender}
      />

      <ProviderSummary results={results} providerStats={providerStats} />
    </div>
  );
}
