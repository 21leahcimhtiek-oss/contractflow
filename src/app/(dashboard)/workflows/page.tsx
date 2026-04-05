import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const { data: workflows } = await supabase
    .from("approval_workflows")
    .select("*, contracts(id, title, type, status)")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  const statusColors = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
        <p className="text-sm text-gray-600 mt-0.5">Manage contract approval chains</p>
      </div>

      <div className="space-y-4">
        {(workflows || []).length === 0 ? (
          <div className="aurora-card p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-600 font-medium">No active workflows</div>
            <div className="text-gray-400 text-sm mt-1">
              Approval workflows will appear here when contracts are submitted for review
            </div>
          </div>
        ) : (
          (workflows || []).map((wf: {
            id: string;
            status: string;
            current_step: number;
            steps: { approver_name: string; approver_email: string; status: string }[];
            contracts: { id: string; title: string; type: string } | null;
          }) => (
            <div key={wf.id} className="aurora-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Link
                    href={`/contracts/${wf.contracts?.id}`}
                    className="font-semibold text-gray-900 hover:text-aurora-600"
                  >
                    {wf.contracts?.title}
                  </Link>
                  <div className="text-sm text-gray-500 mt-0.5">{wf.contracts?.type}</div>
                </div>
                <span className={`status-badge ${statusColors[wf.status as keyof typeof statusColors]}`}>
                  {wf.status.replace("_", " ")}
                </span>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-2 flex-wrap">
                {(wf.steps as { approver_name: string; approver_email: string; status: string }[]).map(
                  (step, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          step.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : step.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : i === wf.current_step
                            ? "bg-aurora-100 text-aurora-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {step.status === "approved" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : step.status === "rejected" ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {step.approver_name}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Approve/Reject actions if it is user's turn */}
              {wf.status === "in_progress" &&
                wf.steps[wf.current_step]?.approver_email === user.email && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <form action={`/api/contracts/${wf.contracts?.id}/approve`} method="POST">
                      <input type="hidden" name="action" value="approve" />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </form>
                    <form action={`/api/contracts/${wf.contracts?.id}/approve`} method="POST">
                      <input type="hidden" name="action" value="reject" />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </form>
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}