import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `approve:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const { data: workflow } = await supabase
    .from("approval_workflows")
    .select("*")
    .eq("contract_id", id)
    .single();

  if (!workflow) return NextResponse.json({ error: "No workflow found for this contract" }, { status: 404 });

  const steps = workflow.steps as Array<{
    approver_email: string;
    approver_name: string;
    status: string;
    comment?: string;
    acted_at?: string;
  }>;

  const currentStep = steps[workflow.current_step];
  if (!currentStep) return NextResponse.json({ error: "Invalid workflow state" }, { status: 400 });

  if (currentStep.approver_email !== user.email) {
    return NextResponse.json({ error: "Not your turn to approve" }, { status: 403 });
  }

  steps[workflow.current_step] = {
    ...currentStep,
    status: parsed.data.action,
    comment: parsed.data.comment,
    acted_at: new Date().toISOString(),
  };

  const isRejected = parsed.data.action === "reject";
  const isLastStep = workflow.current_step === steps.length - 1;

  const newStatus = isRejected ? "rejected" : isLastStep ? "approved" : "in_progress";
  const newCurrentStep = isRejected || isLastStep ? workflow.current_step : workflow.current_step + 1;

  await supabase
    .from("approval_workflows")
    .update({ steps, status: newStatus, current_step: newCurrentStep })
    .eq("id", workflow.id);

  if (!isRejected && isLastStep) {
    await supabase
      .from("contracts")
      .update({ status: "pending_signature" })
      .eq("id", id);
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("org_id")
    .eq("id", id)
    .single();

  if (contract) {
    await supabase.from("audit_trail").insert({
      contract_id: id,
      org_id: contract.org_id,
      user_id: user.id,
      action: `contract.workflow_${parsed.data.action}d`,
      details: { step: workflow.current_step, comment: parsed.data.comment },
    });
  }

  return NextResponse.json({
    message: `Contract ${parsed.data.action}d`,
    workflow_status: newStatus,
  });
}