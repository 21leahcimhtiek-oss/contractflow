import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewContract } from "@/lib/openai/review-contract";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(aiRateLimit, `ai:review:${user.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "AI rate limit exceeded. Please wait before running another review." },
      { status: 429 }
    );
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", contract.org_id)
    .single();

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!contract.content_md || contract.content_md.trim().length < 100) {
    return NextResponse.json({ error: "Contract has insufficient content for review" }, { status: 400 });
  }

  try {
    const result = await reviewContract(contract.content_md);

    await supabase
      .from("contracts")
      .update({
        risk_score: result.risk_score,
        ai_summary: result.summary,
        status: contract.status === "draft" ? "review" : contract.status,
      })
      .eq("id", id);

    await supabase.from("audit_trail").insert({
      contract_id: id,
      org_id: contract.org_id,
      user_id: user.id,
      action: "contract.ai_reviewed",
      details: {
        risk_score: result.risk_score,
        findings_count: result.findings.length,
        missing_clauses: result.missing_clauses,
      },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI review failed" },
      { status: 500 }
    );
  }
}