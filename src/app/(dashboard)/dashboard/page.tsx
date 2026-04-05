import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  PenLine,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, orgs(plan)")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const orgId = membership.org_id;
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    { count: activeCount },
    { count: pendingSignCount },
    { count: expiringCount },
    { data: recentContracts },
    { data: valueData },
  ] = await Promise.all([
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending_signature"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")
      .lte("end_date", in30Days.toISOString().split("T")[0])
      .gte("end_date", today.toISOString().split("T")[0]),
    supabase
      .from("contracts")
      .select("id, title, status, type, counterparty_name, created_at, value_usd")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("contracts")
      .select("value_usd")
      .eq("org_id", orgId)
      .in("status", ["active", "pending_signature"])
      .not("value_usd", "is", null),
  ]);

  const totalValue = (valueData || []).reduce(
    (sum: number, c: { value_usd: number | null }) => sum + (c.value_usd || 0),
    0
  );

  const stats = [
    {
      label: "Active Contracts",
      value: activeCount || 0,
      icon: FileText,
      color: "text-aurora-600",
      bg: "bg-aurora-50",
      href: "/contracts?status=active",
    },
    {
      label: "Pending Signatures",
      value: pendingSignCount || 0,
      icon: PenLine,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/signatures",
    },
    {
      label: "Expiring in 30 Days",
      value: expiringCount || 0,
      icon: Clock,
      color: "text-red-500",
      bg: "bg-red-50",
      href: "/contracts?expiring=true",
    },
    {
      label: "Total Contract Value",
      value: `$${(totalValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/analytics",
    },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-blue-100 text-blue-700",
    pending_signature: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    terminated: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-0.5">Overview of your contract activity</p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 bg-aurora-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-aurora-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          New Contract
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="aurora-card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="aurora-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "Draft a new contract", href: "/contracts/new", icon: FileText },
              { label: "Browse templates", href: "/templates", icon: TrendingUp },
              { label: "View pending signatures", href: "/signatures", icon: PenLine },
              { label: "Check approval workflows", href: "/workflows", icon: Clock },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <action.icon className="w-4 h-4 text-gray-400 group-hover:text-aurora-600" />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-aurora-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="aurora-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Contracts</h2>
            <Link href="/contracts" className="text-xs text-aurora-600 hover:text-aurora-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {(recentContracts || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No contracts yet.{" "}
                <Link href="/contracts/new" className="text-aurora-600 hover:underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              (recentContracts || []).map((contract: {
                id: string;
                title: string;
                status: string;
                type: string;
                counterparty_name: string | null;
                created_at: string;
                value_usd: number | null;
              }) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-aurora-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-aurora-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{contract.title}</div>
                      <div className="text-xs text-gray-500">
                        {contract.counterparty_name || "No counterparty"} ·{" "}
                        {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    {contract.value_usd && (
                      <span className="text-xs text-gray-600 font-medium">
                        ${contract.value_usd.toLocaleString()}
                      </span>
                    )}
                    <span className={`status-badge ${statusColors[contract.status] || "bg-gray-100 text-gray-600"}`}>
                      {contract.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(expiringCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-800">
              {expiringCount} contract{(expiringCount || 0) > 1 ? "s" : ""} expiring in 30 days
            </div>
            <div className="text-sm text-amber-700 mt-0.5">
              Review and renew to avoid disruption.{" "}
              <Link href="/contracts?expiring=true" className="underline font-medium">
                View expiring contracts
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}