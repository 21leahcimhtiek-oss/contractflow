import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PenLine, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export default async function SignaturesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  // Get signatures pending for this user's email
  const { data: myPendingSignatures } = await supabase
    .from("signatures")
    .select("*, contracts(id, title, type, counterparty_name, status)")
    .eq("signer_email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get all signatures for org's contracts
  const { data: orgSignatures } = await supabase
    .from("signatures")
    .select("*, contracts!inner(id, title, org_id)")
    .eq("contracts.org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    signed: <CheckCircle className="w-4 h-4 text-green-500" />,
    declined: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signatures</h1>
        <p className="text-sm text-gray-600 mt-0.5">Track e-signature status across all contracts</p>
      </div>

      {/* My pending signatures */}
      {(myPendingSignatures || []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-yellow-500" />
            Awaiting Your Signature ({myPendingSignatures?.length})
          </h2>
          <div className="space-y-3">
            {(myPendingSignatures || []).map((sig: {
              id: string;
              signer_name: string;
              role: string;
              created_at: string;
              contracts: { id: string; title: string; type: string } | null;
            }) => (
              <div key={sig.id} className="aurora-card p-5 border-l-4 border-yellow-400">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/contracts/${sig.contracts?.id}`}
                      className="font-semibold text-gray-900 hover:text-aurora-600"
                    >
                      {sig.contracts?.title}
                    </Link>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {sig.role} · Requested {format(new Date(sig.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <Link
                    href={`/contracts/${sig.contracts?.id}?sign=true`}
                    className="bg-aurora-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-aurora-700 transition-colors"
                  >
                    Sign Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All org signatures */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All Signature Requests</h2>
        <div className="aurora-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Contract</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Signer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(orgSignatures || []).map((sig: {
                id: string;
                signer_name: string;
                signer_email: string;
                role: string;
                status: string;
                signed_at: string | null;
                created_at: string;
                contracts: { id: string; title: string } | null;
              }) => (
                <tr key={sig.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/contracts/${sig.contracts?.id}`} className="text-sm font-medium text-gray-900 hover:text-aurora-600">
                      {sig.contracts?.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{sig.signer_name}</div>
                    <div className="text-xs text-gray-400">{sig.signer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sig.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[sig.status as keyof typeof statusIcon]}
                      <span className="text-sm capitalize">{sig.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sig.signed_at
                      ? format(new Date(sig.signed_at), "MMM d, yyyy")
                      : format(new Date(sig.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}