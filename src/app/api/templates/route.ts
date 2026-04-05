import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["nda", "msa", "sow", "employment", "vendor", "other"]),
  content_md: z.string().min(1),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "date", "number", "email"]),
    required: z.boolean().default(true),
    default: z.union([z.string(), z.number()]).optional(),
    description: z.string().optional(),
  })).default([]),
  is_public: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `templates:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  let query = supabase
    .from("contract_templates")
    .select("*")
    .or(membership ? `is_public.eq.true,org_id.eq.${membership.org_id}` : "is_public.eq.true")
    .order("is_public", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `templates:create:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });

  const { data, error } = await supabase
    .from("contract_templates")
    .insert({ ...parsed.data, org_id: membership.org_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}