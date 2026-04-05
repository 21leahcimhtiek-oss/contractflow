"use client";

import { useState } from "react";
import { Bot, AlertTriangle, Info, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { RiskBadge } from "./RiskBadge";

interface Finding {
  severity: "high" | "medium" | "low" | "info";
  clause: string;
  issue: string;
  suggestion: string;
}

interface AiReviewPanelProps {
  contractId: string;
  riskScore: number | null;
  aiSummary: string | null;
  findings: Finding[];
  onReviewComplete?: () => void;
}

const severityConfig = {
  high: { icon: AlertTriangle, className: "text-red-600 bg-red-50 border-red-200" },
  medium: { icon: AlertTriangle, className: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  low: { icon: Info, className: "text-blue-600 bg-blue-50 border-blue-200" },
  info: { icon: CheckCircle, className: "text-green-600 bg-green-50 border-green-200" },
};

export function AiReviewPanel({
  contractId,
  riskScore,
  aiSummary,
  findings,
  onReviewComplete,
}: AiReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localFindings, setLocalFindings] = useState(findings);
  const [localScore, setLocalScore] = useState(riskScore);
  const [localSummary, setLocalSummary] = useState(aiSummary);

  const handleReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/review`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const data = await res.json();
      setLocalScore(data.risk_score);
      setLocalSummary(data.ai_summary);
      setLocalFindings(data.findings ?? []);
      onReviewComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI review failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-aurora-600" />
          <h3 className="font-semibold text-gray-900 text-sm">AI Review</h3>
          {localScore !== null && <RiskBadge score={localScore} size="sm" />}
        </div>
        <button
          onClick={handleReview}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-aurora-600 hover:text-aurora-800 font-medium disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {loading ? "Reviewing..." : localScore !== null ? "Re-analyze" : "Run Analysis"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {localSummary && (
        <div className="bg-aurora-50 border border-aurora-100 rounded-lg px-3 py-2.5 mb-3">
          <div className="text-xs font-semibold text-aurora-700 mb-1">Executive Summary</div>
          <p className="text-xs text-gray-700 leading-relaxed">{localSummary}</p>
        </div>
      )}

      {localFindings.length > 0 ? (
        <div className="space-y-2">
          {localFindings.map((finding, i) => {
            const cfg = severityConfig[finding.severity];
            return (
              <div key={i} className={`border rounded-lg p-2.5 ${cfg.className}`}>
                <div className="flex items-start gap-2">
                  <cfg.icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">{finding.clause}</div>
                    <div className="text-xs mt-0.5 opacity-90">{finding.issue}</div>
                    {finding.suggestion && (
                      <div className="text-xs mt-1 opacity-75 italic">{finding.suggestion}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && !localSummary && (
          <div className="text-center py-4 text-xs text-gray-400">
            Run AI analysis to identify risk areas
          </div>
        )
      )}
    </div>
  );
}