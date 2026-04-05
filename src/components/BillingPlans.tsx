"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 79,
    description: "For small teams and startups",
    features: [
      "Up to 25 contracts/month",
      "E-signatures",
      "Basic workflows",
      "5 team members",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 199,
    description: "For growing legal teams",
    features: [
      "Up to 100 contracts/month",
      "AI contract drafting",
      "AI risk analysis",
      "Unlimited team members",
      "Advanced workflows",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 499,
    description: "For large enterprises",
    features: [
      "Unlimited contracts",
      "All AI features",
      "Custom templates",
      "SSO / SAML",
      "Dedicated CSM",
      "SLA guarantee",
    ],
  },
];

interface BillingPlansProps {
  currentPlanId?: string;
}

export function BillingPlans({ currentPlanId }: BillingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isLoading = loading === plan.id;

        return (
          <div
            key={plan.id}
            className={`aurora-card p-6 flex flex-col gap-5 relative ${
              plan.highlight ? "ring-2 ring-aurora-400" : ""
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-aurora-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div>
              <div className="font-bold text-gray-900 text-lg">{plan.name}</div>
              <div className="text-gray-500 text-sm">{plan.description}</div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  ${plan.priceMonthly}
                </span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => !isCurrent && handleUpgrade(plan.id)}
              disabled={isCurrent || isLoading}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                isCurrent
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : plan.highlight
                  ? "bg-aurora-600 text-white hover:bg-aurora-700"
                  : "border border-aurora-300 text-aurora-700 hover:bg-aurora-50"
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}