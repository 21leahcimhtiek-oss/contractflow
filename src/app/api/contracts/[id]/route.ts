import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const updateContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(["draft", "review", "pending_signature", "active", "expired", "terminated"]).optional(),
  counterparty_name: z.string().max(200).optional().nullable(),
  counterparty_email: z.string().email().optional().nullable(),
  value_usd: z.number().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  content_md: z.string().optional().nullable(),
  ai_summary: z.string().optional().nullable(),
  risk_score: z.number().min(0).max(100).optional().nullable(),
});

async function getContractWithAuth(contractId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, supabase, user: null, membership: null, contract: null };

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();

  if (!contract) return { error: "Not found", status: 404, supabase, user, membership: null, contract: null };

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", contract.org_id)
    .single();

  if (!membership) return { error: "Forbidden", status: 403, supabase, user, membership: null, contract };

  return { error: null, status: 200, supabase, user, membership, contract };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, supabase, user, membership, contract } = await getContractWithAuth(id);
  if (error || !supabase || !user || !membership || !contract) {
    return NextResponse.json({ error }, { status });
  }

  const rl = await checkRateLimit(standardRateLimit, `contract:get:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const [{ data: versions }, { data: signatures }, { data: workflow }] = await Promise.all([
    supabase.from("contract_versions").select("*").eq("contract_id", id).order("version_number", { ascending: false }),
    supabase.from("signatures").select("*").eq("contract_id", id).order("created_at"),
    supabase.from("approval_workflows").select("*").eq("contract_id", id).single(),
  ]);

  return NextResponse.json({ data: { ...contract, versions, signatures, workflow } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, supabase, user, membership, contract } = await getContractWithAuth(id);
  if (error || !supabase || !user || !membership || !contract) {
    return NextResponse.json({ error }, { status });
  }

  if (membership.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const rl = await checkRateLimit(standardRateLimit, `contract:patch:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = updateContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("contracts")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from("audit_trail").insert({
    contract_id: id,
    org_id: contract.org_id,
    user_id: user.id,
    action: "contract.updated",
    details: { changes: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, supabase, user, membership, contract } = await getContractWithAuth(id);
  if (error || !supabase || !user || !membership || !contract) {
    return NextResponse.json({ error }, { status });
  }

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("contracts").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ message: "Contract deleted" });
}