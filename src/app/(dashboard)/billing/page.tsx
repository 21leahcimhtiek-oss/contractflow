import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe/client";
import { PLAN_LIMITS } from "@/types";
import { BillingPlans } from "@/components/BillingPlans";
import { CheckCircle, Zap } from "lucide-react";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(id, name, plan, stripe_subscription_id)")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const org = membership.orgs as { id: string; name: string; plan: string; stripe_subscription_id: string | null } | null;
  const currentPlan = org?.plan || "starter";
  const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS];

  const { count: contractCount } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("org_id", membership.org_id)
    .in("status", ["active", "draft", "review", "pending_signature"]);

  const usagePercent =
    planLimits.contracts === -1
      ? 0
      : Math.min(100, ((contractCount || 0) / planLimits.contracts) * 100);

  const currentPlanConfig = PLANS.find((p) => p.id === currentPlan);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-sm text-gray-600 mt-0.5">Manage your subscription and usage</p>
      </div>

      {/* Current plan */}
      <div className="aurora-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-aurora-600" />
              <span className="font-semibold text-gray-900 capitalize">{currentPlan} Plan</span>
              <span className="text-xs bg-aurora-100 text-aurora-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              ${currentPlanConfig?.priceMonthly}/month
            </div>
          </div>
          {org?.stripe_subscription_id && membership.role === "owner" && (
            <form action="/api/billing/portal" method="POST">
              <button
                type="submit"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage Billing
              </button>
            </form>
          )}
        </div>

        {/* Usage */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600">Contracts</span>
              <span className="font-medium text-gray-900">
                {contractCount || 0} / {planLimits.contracts === -1 ? "∞" : planLimits.contracts}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-aurora-500"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {currentPlanConfig?.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade options */}
      {currentPlan !== "enterprise" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Your Plan</h2>
          <BillingPlans currentPlan={currentPlan} orgId={membership.org_id} />
        </div>
      )}
    </div>
  );
}