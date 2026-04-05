import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const createVersionSchema = z.object({
  content_md: z.string().min(1),
  change_summary: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `versions:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { data: contract } = await supabase
    .from("contracts")
    .select("org_id")
    .eq("id", id)
    .single();

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", contract.org_id)
    .single();

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: versions } = await supabase
    .from("contract_versions")
    .select("*")
    .eq("contract_id", id)
    .order("version_number", { ascending: false });

  return NextResponse.json({ data: versions || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `versions:create:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = createVersionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  const { data: contract } = await supabase
    .from("contracts")
    .select("org_id")
    .eq("id", id)
    .single();

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", contract.org_id)
    .single();

  if (!membership || membership.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { data: lastVersion } = await supabase
    .from("contract_versions")
    .select("version_number")
    .eq("contract_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (lastVersion?.version_number || 0) + 1;

  const { data, error } = await supabase
    .from("contract_versions")
    .insert({
      contract_id: id,
      version_number: nextVersion,
      content_md: parsed.data.content_md,
      change_summary: parsed.data.change_summary,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("contracts")
    .update({ content_md: parsed.data.content_md })
    .eq("id", id);

  return NextResponse.json({ data }, { status: 201 });
}