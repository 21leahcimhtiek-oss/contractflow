import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, User, FileText } from "lucide-react";
import { ContractViewer } from "@/components/ContractViewer";
import { SignaturePanel } from "@/components/SignaturePanel";
import { ApprovalTimeline } from "@/components/ApprovalTimeline";
import { RiskBadge } from "@/components/RiskBadge";
import { AiReviewPanel } from "@/components/AiReviewPanel";
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from "@/types";
import { format } from "date-fns";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contract) notFound();

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("org_id", contract.org_id)
    .single();

  if (!membership) notFound();

  const [
    { data: signatures },
    { data: workflow },
    { data: versions },
    { data: comments },
  ] = await Promise.all([
    supabase.from("signatures").select("*").eq("contract_id", id).order("created_at"),
    supabase.from("approval_workflows").select("*").eq("contract_id", id).single(),
    supabase.from("contract_versions").select("*").eq("contract_id", id).order("version_number", { ascending: false }).limit(10),
    supabase.from("comments").select("*").eq("contract_id", id).eq("resolved", false).order("created_at").limit(20),
  ]);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-blue-100 text-blue-700",
    pending_signature: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    terminated: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Contracts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <span className={`status-badge ${statusColors[contract.status]}`}>
              {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
            </span>
            {contract.risk_score !== null && (
              <RiskBadge score={contract.risk_score} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
              {CONTRACT_TYPE_LABELS[contract.type as keyof typeof CONTRACT_TYPE_LABELS]}
            </span>
            {contract.counterparty_name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {contract.counterparty_name}
              </span>
            )}
            {contract.value_usd && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                ${contract.value_usd.toLocaleString()}
              </span>
            )}
            {contract.end_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Expires {format(new Date(contract.end_date), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {(membership.role === "owner" || membership.role === "admin") && (
            <form action={`/api/contracts/${id}/review`} method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-aurora-600 text-white text-sm font-semibold rounded-lg hover:bg-aurora-700 transition-colors"
              >
                AI Review
              </button>
            </form>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {contract.ai_summary && (
        <div className="aurora-card p-5 border-l-4 border-aurora-400">
          <div className="text-xs font-semibold text-aurora-600 uppercase tracking-wide mb-1">AI Summary</div>
          <p className="text-sm text-gray-700 leading-relaxed">{contract.ai_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Contract Content */}
          <div className="aurora-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Contract Content
              </h2>
              {(versions || []).length > 0 && (
                <span className="text-xs text-gray-500">
                  v{(versions || [])[0]?.version_number || 1}
                </span>
              )}
            </div>
            {contract.content_md ? (
              <ContractViewer content={contract.content_md} />
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No content yet. Use AI Draft to generate contract content.
              </div>
            )}
          </div>

          {/* Comments */}
          {(comments || []).length > 0 && (
            <div className="aurora-card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Comments ({comments?.length})</h2>
              <div className="space-y-3">
                {(comments || []).map((comment: { id: string; content: string; created_at: string }) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Signatures */}
          <SignaturePanel
            signatures={signatures || []}
            contractId={id}
            userEmail={user.email || ""}
          />

          {/* Approval workflow */}
          {workflow && (
            <ApprovalTimeline
              workflow={workflow}
              userEmail={user.email || ""}
              contractId={id}
            />
          )}

          {/* AI Review Panel */}
          <AiReviewPanel
            contractId={id}
            riskScore={contract.risk_score}
            summary={contract.ai_summary}
          />

          {/* Version history */}
          {(versions || []).length > 0 && (
            <div className="aurora-card p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Version History</h3>
              <div className="space-y-2">
                {(versions || []).map((v: { id: string; version_number: number; change_summary: string | null; created_at: string }) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">v{v.version_number}</span>
                    <span className="text-gray-500 truncate mx-2">{v.change_summary || "No summary"}</span>
                    <span className="text-gray-400 flex-shrink-0">{format(new Date(v.created_at), "MMM d")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}