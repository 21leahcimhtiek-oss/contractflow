import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { draftContract } from "@/lib/openai/draft-contract";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { PLAN_LIMITS } from "@/types";

const draftSchema = z.object({
  type: z.enum(["nda", "msa", "sow", "employment", "vendor", "other"]),
  variables: z.record(z.string()).default({}),
  template_content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(aiRateLimit, `ai:draft:${user.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "AI rate limit exceeded. Retry in a minute." },
      { status: 429 }
    );
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, orgs(plan)")
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

  const org = membership.orgs as { plan: string } | null;
  const plan = (org?.plan || "starter") as keyof typeof PLAN_LIMITS;
  if (plan === "starter") {
    return NextResponse.json(
      { error: "AI drafting requires Pro or Enterprise plan. Please upgrade." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  try {
    const result = await draftContract(parsed.data.type, parsed.data.variables, parsed.data.template_content);
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Draft failed" },
      { status: 500 }
    );
  }
}