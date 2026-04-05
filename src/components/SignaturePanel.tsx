"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle, PenLine, Loader2 } from "lucide-react";
import type { Signature } from "@/types";

interface SignaturePanelProps {
  signatures: Signature[];
  contractId: string;
  userEmail: string;
}

export function SignaturePanel({ signatures, contractId, userEmail }: SignaturePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSignatures, setLocalSignatures] = useState(signatures);

  const myPendingSignature = localSignatures.find(
    (s) => s.signer_email === userEmail && s.status === "pending"
  );

  const handleSign = async (action: "sign" | "decline") => {
    if (!myPendingSignature) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_email: myPendingSignature.signer_email,
          signer_name: myPendingSignature.signer_name,
          action,
          role: myPendingSignature.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setLocalSignatures((prev) =>
        prev.map((s) =>
          s.id === myPendingSignature.id
            ? { ...s, status: action === "sign" ? "signed" : "declined", signed_at: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setLoading(false);
    }
  };

  if (localSignatures.length === 0) return null;

  return (
    <div className="aurora-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <PenLine className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900 text-sm">Signatures</h3>
      </div>

      <div className="space-y-2 mb-3">
        {localSignatures.map((sig) => (
          <div key={sig.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{sig.signer_name}</div>
              <div className="text-xs text-gray-500">{sig.signer_email}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {sig.status === "signed" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : sig.status === "declined" ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-xs font-medium capitalize ${
                sig.status === "signed" ? "text-green-600" :
                sig.status === "declined" ? "text-red-600" : "text-yellow-600"
              }`}>
                {sig.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {myPendingSignature && (
        <div className="pt-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => handleSign("sign")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Sign
          </button>
          <button
            onClick={() => handleSign("decline")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}