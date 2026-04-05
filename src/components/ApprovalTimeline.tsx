"use client";

import { useState } from "react";
import { Check, X, Clock, ChevronRight, Loader2 } from "lucide-react";

interface WorkflowStep {
  approver_email: string;
  approver_name: string;
  status: "pending" | "approved" | "rejected";
  decided_at?: string;
  comment?: string;
}

interface ApprovalTimelineProps {
  steps: WorkflowStep[];
  currentStep: number;
  contractId: string;
  workflowId: string;
  userEmail: string;
  onAction?: () => void;
}

export function ApprovalTimeline({
  steps,
  currentStep,
  contractId,
  workflowId,
  userEmail,
  onAction,
}: ApprovalTimelineProps) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCurrentApprover =
    steps[currentStep]?.approver_email === userEmail &&
    steps[currentStep]?.status === "pending";

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: workflowId, action, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onAction?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.status === "approved"
                ? "bg-green-100 text-green-600"
                : step.status === "rejected"
                ? "bg-red-100 text-red-600"
                : i === currentStep
                ? "bg-aurora-100 text-aurora-600 ring-2 ring-aurora-400 ring-offset-1"
                : "bg-gray-100 text-gray-400"
            }`}>
              {step.status === "approved" ? <Check className="w-3.5 h-3.5" /> :
               step.status === "rejected" ? <X className="w-3.5 h-3.5" /> :
               <Clock className="w-3.5 h-3.5" />}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-px h-6 mt-1 ${step.status === "approved" ? "bg-green-200" : "bg-gray-100"}`} />
            )}
          </div>
          <div className="pt-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{step.approver_name}</span>
              {i === currentStep && step.status === "pending" && (
                <span className="text-xs bg-aurora-100 text-aurora-700 px-1.5 py-0.5 rounded-full font-medium">Current</span>
              )}
            </div>
            <div className="text-xs text-gray-500">{step.approver_email}</div>
            {step.comment && (
              <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 italic">
                &ldquo;{step.comment}&rdquo;
              </div>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${
            i < currentStep ? "text-green-400" : "text-gray-300"
          }`} />
        </div>
      ))}

      {isCurrentApprover && (
        <div className="pt-3 border-t border-gray-100">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)..."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-aurora-400"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("approve")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Approve
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}