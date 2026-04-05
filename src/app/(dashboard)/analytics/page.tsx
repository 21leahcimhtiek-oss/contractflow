import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const orgId = membership.org_id;

  const { data: contracts } = await supabase
    .from("contracts")
    .select("type, status, value_usd, risk_score, created_at, start_date, end_date")
    .eq("org_id", orgId);

  const allContracts = contracts || [];

  // Stats
  const totalValue = allContracts.reduce((sum, c) => sum + (c.value_usd || 0), 0);
  const activeContracts = allContracts.filter((c) => c.status === "active");
  const avgRisk =
    allContracts.filter((c) => c.risk_score !== null).reduce((sum, c) => sum + (c.risk_score || 0), 0) /
    (allContracts.filter((c) => c.risk_score !== null).length || 1);

  // By type
  const byType = allContracts.reduce((acc: Record<string, number>, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  // By status
  const byStatus = allContracts.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  // Risk distribution
  const riskBuckets = {
    Low: allContracts.filter((c) => c.risk_score !== null && c.risk_score < 30).length,
    Medium: allContracts.filter((c) => c.risk_score !== null && c.risk_score >= 30 && c.risk_score < 70).length,
    High: allContracts.filter((c) => c.risk_score !== null && c.risk_score >= 70).length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600 mt-0.5">Contract performance and insights</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Total Contracts", value: allContracts.length },
          { label: "Active Contracts", value: activeContracts.length },
          { label: "Total Value", value: `$${(totalValue / 1000).toFixed(0)}K` },
          { label: "Avg Risk Score", value: avgRisk.toFixed(0) },
        ].map((stat) => (
          <div key={stat.label} className="aurora-card p-6">
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* By Type */}
        <div className="aurora-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contracts by Type</h2>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 uppercase font-medium">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aurora-500 rounded-full"
                      style={{ width: `${(count / allContracts.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="aurora-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contracts by Status</h2>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{status.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(count / allContracts.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="aurora-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            {Object.entries(riskBuckets).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  level === "High" ? "text-red-600" : level === "Medium" ? "text-yellow-600" : "text-green-600"
                }`}>{level}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        level === "High" ? "bg-red-400" : level === "Medium" ? "bg-yellow-400" : "bg-green-400"
                      }`}
                      style={{ width: allContracts.filter(c => c.risk_score !== null).length > 0
                        ? `${(count / allContracts.filter(c => c.risk_score !== null).length) * 100}%`
                        : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}