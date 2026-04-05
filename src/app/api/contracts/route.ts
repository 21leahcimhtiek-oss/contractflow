import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PLAN_LIMITS } from "@/types";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const createContractSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["nda", "msa", "sow", "employment", "vendor", "other"]),
  description: z.string().max(1000).optional(),
  counterparty_name: z.string().max(200).optional(),
  counterparty_email: z.string().email().optional().or(z.literal("")),
  value_usd: z.number().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  content_md: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `contracts:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);
  const from = (page - 1) * perPage;

  let query = supabase
    .from("contracts")
    .select("*", { count: "exact" })
    .eq("org_id", membership.org_id)
    .order("updated_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    total: count || 0,
    page,
    per_page: perPage,
    has_more: (count || 0) > page * perPage,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `contracts:create:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, orgs(plan)")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

  const org = membership.orgs as { plan: string } | null;
  const plan = (org?.plan || "starter") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  // Check plan limits
  if (limits.contracts !== -1) {
    const { count } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .in("status", ["active", "draft", "review", "pending_signature"]);

    if ((count || 0) >= limits.contracts) {
      return NextResponse.json(
        { error: `Plan limit reached. Upgrade to create more than ${limits.contracts} contracts.` },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      ...parsed.data,
      org_id: membership.org_id,
      created_by: user.id,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to audit trail
  await supabase.from("audit_trail").insert({
    contract_id: data.id,
    org_id: membership.org_id,
    user_id: user.id,
    action: "contract.created",
    details: { title: data.title, type: data.type },
  });

  return NextResponse.json({ data }, { status: 201 });
}