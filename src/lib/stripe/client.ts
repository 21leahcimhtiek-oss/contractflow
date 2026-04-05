import Stripe from "stripe";
import type { OrgPlan } from "@/types";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export interface PlanConfig {
  id: OrgPlan;
  name: string;
  priceId: string;
  priceMonthly: number;
  contractLimit: number;
  memberLimit: number;
  features: string[];
}

export const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    priceMonthly: 79,
    contractLimit: 10,
    memberLimit: 3,
    features: [
      "10 active contracts",
      "3 team members",
      "AI contract review",
      "Basic e-signature",
      "PDF export",
      "Email notifications",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    priceMonthly: 199,
    contractLimit: 100,
    memberLimit: 15,
    features: [
      "100 active contracts",
      "15 team members",
      "AI drafting + review",
      "Advanced e-signature",
      "Custom approval workflows",
      "Template library",
      "Analytics dashboard",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    priceMonthly: 499,
    contractLimit: -1,
    memberLimit: -1,
    features: [
      "Unlimited contracts",
      "Unlimited team members",
      "All Pro features",
      "SSO / SAML",
      "Custom workflows",
      "Dedicated support",
      "SLA guarantee",
      "API + webhooks",
    ],
  },
];

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLANS.find((p) => p.priceId === priceId);
}

export function getPlanById(planId: OrgPlan): PlanConfig {
  return PLANS.find((p) => p.id === planId) ?? PLANS[0];
}