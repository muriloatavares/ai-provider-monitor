/**
 * @file useKeyChecker.js
 * @description Hook customizado para gerenciar estado e processamento de verificação de chaves.
 *
 * Encapsula a lógica de drag-and-drop, leitura de arquivos e comunicação
 * via Server-Sent Events (SSE) com o backend, além de agregações analíticas.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { useState, useCallback, useRef } from "react";

export function useKeyChecker() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [totalKeys, setTotalKeys] = useState(0);
  const fileInputRef = useRef(null);

  const total = results ? results.length : 0;

  // Agregações de status
  const validKeys = results
    ? results.filter((r) => r.keyStatus === "valid").length
    : 0;
  const invalidKeys = results
    ? results.filter(
        (r) => r.keyStatus === "invalid" || r.keyStatus === "error",
      ).length
    : 0;
  const restrictedKeys = results
    ? results.filter((r) => r.keyStatus === "restricted").length
    : 0;
  const rateLimitedKeys = results
    ? results.filter((r) => r.keyStatus === "rate_limited").length
    : 0;

  // Agregações de quotas
  const unknownQuotaKeys = results
    ? results.filter((r) => r.quotaStatus === "unknown").length
    : 0;
  const exhaustedKeys = results
    ? results.filter((r) => r.quotaStatus === "exhausted").length
    : 0;
  const freeTierKeys = results
    ? results.filter((r) => r.quotaStatus === "free_tier").length
    : 0;
  const availableKeys = results
    ? results.filter((r) => r.quotaStatus === "available").length
    : 0;

  const totalBalance = results
    ? results.reduce((sum, r) => {
        if (r.balance && !isNaN(parseFloat(r.balance))) {
          return sum + parseFloat(r.balance);
        }
        return sum;
      }, 0)
    : 0;

  // Estatísticas por provider
  const providerStats = results
    ? results.reduce((acc, r) => {
        if (!acc[r.provider])
          acc[r.provider] = {
            valid: 0,
            invalid: 0,
            restricted: 0,
            rate_limited: 0,
            error: 0,
            unknown: 0,
            total: 0,
            balance: 0,
            available: 0,
            unknownQuota: 0,
            exhausted: 0,
            free_tier: 0,
          };
        acc[r.provider].total++;
        if (r.keyStatus)
          acc[r.provider][r.keyStatus] =
            (acc[r.provider][r.keyStatus] || 0) + 1;

        if (r.quotaStatus === "available") {
          acc[r.provider].available++;
          if (r.balance && !isNaN(parseFloat(r.balance))) {
            acc[r.provider].balance += parseFloat(r.balance);
          }
        } else if (r.quotaStatus === "exhausted") {
          acc[r.provider].exhausted++;
        } else if (r.quotaStatus === "free_tier") {
          acc[r.provider].free_tier++;
        } else if (r.quotaStatus === "unknown") {
          acc[r.provider].unknownQuota++;
        }
        return acc;
      }, {})
    : {};

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processText = async (text) => {
    setIsProcessing(true);
    setResults([]);
    setTotalKeys(0);

    try {
      const res = await fetch("/api/check-keys-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");

        buffer = lines.pop() || "";

        for (const block of lines) {
          const linesInBlock = block.split("\n");
          let event = "message";
          let data = null;

          for (const line of linesInBlock) {
            if (line.startsWith("event: ")) {
              event = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              data = JSON.parse(line.replace("data: ", "").trim());
            }
          }

          if (event === "init") {
            setTotalKeys(data.total);
          } else if (event === "result") {
            setResults((prev) => [...(prev || []), data]);
          } else if (event === "done") {
            setIsProcessing(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Error processing keys: ${err.message}`);
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList);
    const txtFiles = files.filter(
      (f) => f.name.endsWith(".txt") || f.type === "text/plain",
    );

    if (txtFiles.length === 0) {
      alert("Please select .txt files only");
      return;
    }

    Promise.all(txtFiles.map((file) => file.text())).then((texts) => {
      const combinedText = texts.join("\n");
      processText(combinedText);
    });
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const skeletonsToRender =
    isProcessing && totalKeys > total ? Math.min(totalKeys - total, 10) : 0;

  return {
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
  };
}
