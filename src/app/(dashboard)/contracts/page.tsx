import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Search, Filter } from "lucide-react";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types";
import { formatDistanceToNow, differenceInDays } from "date-fns";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const page = Number(params.page) || 1;
  const perPage = 20;
  const from = (page - 1) * perPage;

  let query = supabase
    .from("contracts")
    .select("*", { count: "exact" })
    .eq("org_id", membership.org_id)
    .order("updated_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (params.status) query = query.eq("status", params.status);
  if (params.type) query = query.eq("type", params.type);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  const { data: contracts, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-blue-100 text-blue-700",
    pending_signature: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    terminated: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-600 mt-0.5">{count || 0} total contracts</p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 bg-aurora-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-aurora-700"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </Link>
      </div>

      {/* Filters */}
      <div className="aurora-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form>
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </form>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            {["draft", "review", "pending_signature", "active", "expired"].map((s) => (
              <Link
                key={s}
                href={`/contracts?status=${s}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  params.status === s
                    ? "bg-aurora-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CONTRACT_STATUS_LABELS[s as keyof typeof CONTRACT_STATUS_LABELS]}
              </Link>
            ))}
            {params.status && (
              <Link href="/contracts" className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700">
                Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Contracts table */}
      <div className="aurora-card overflow-hidden">
        {(contracts || []).length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-600 font-medium">No contracts found</div>
            <div className="text-gray-400 text-sm mt-1">
              <Link href="/contracts/new" className="text-aurora-600 hover:underline">
                Create your first contract
              </Link>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Title</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Counterparty</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Value</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden xl:table-cell">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {(contracts || []).map((contract: {
                id: string;
                title: string;
                type: string;
                counterparty_name: string | null;
                value_usd: number | null;
                status: string;
                end_date: string | null;
                updated_at: string;
              }) => {
                const daysLeft = contract.end_date
                  ? differenceInDays(new Date(contract.end_date), new Date())
                  : null;

                return (
                  <tr key={contract.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="font-medium text-gray-900 hover:text-aurora-600 text-sm block">
                        {contract.title}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Updated {formatDistanceToNow(new Date(contract.updated_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                        {CONTRACT_TYPE_LABELS[contract.type as keyof typeof CONTRACT_TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      {contract.counterparty_name || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium hidden lg:table-cell">
                      {contract.value_usd ? `$${contract.value_usd.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`status-badge ${statusColors[contract.status] || "bg-gray-100 text-gray-600"}`}>
                        {contract.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      {daysLeft !== null ? (
                        <span className={`text-xs font-medium ${daysLeft <= 30 ? "text-red-500" : daysLeft <= 90 ? "text-yellow-600" : "text-gray-500"}`}>
                          {daysLeft <= 0 ? "Expired" : `${daysLeft}d`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/contracts?page=${p}${params.status ? `&status=${params.status}` : ""}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                page === p ? "bg-aurora-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}