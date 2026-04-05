import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role, orgs(stripe_customer_id)")
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner"].includes(membership.role)) {
    return NextResponse.json({ error: "Only org owners can manage billing" }, { status: 403 });
  }

  const org = membership.orgs as { stripe_customer_id: string | null } | null;
  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return NextResponse.json({ url: session.url });
}