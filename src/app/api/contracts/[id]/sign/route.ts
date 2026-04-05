import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { standardRateLimit, checkRateLimit } from "@/lib/rate-limit";

const signSchema = z.object({
  signer_email: z.string().email(),
  signer_name: z.string().min(1),
  action: z.enum(["sign", "decline"]),
  role: z.string().default("signer"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(standardRateLimit, `sign:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 400 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("org_id, status, title")
    .eq("id", id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;

  // Upsert signature record
  const { error: sigError } = await supabase
    .from("signatures")
    .upsert(
      {
        contract_id: id,
        signer_email: parsed.data.signer_email,
        signer_name: parsed.data.signer_name,
        role: parsed.data.role,
        status: parsed.data.action === "sign" ? "signed" : "declined",
        signed_at: parsed.data.action === "sign" ? new Date().toISOString() : null,
        ip_address: ip,
      },
      { onConflict: "contract_id,signer_email" }
    );

  if (sigError) return NextResponse.json({ error: sigError.message }, { status: 500 });

  // Check if all signatures are complete
  if (parsed.data.action === "sign") {
    const { data: allSigs } = await supabase
      .from("signatures")
      .select("status")
      .eq("contract_id", id);

    const allSigned = allSigs?.every((s) => s.status === "signed");
    if (allSigned && allSigs && allSigs.length > 0) {
      await supabase
        .from("contracts")
        .update({ status: "active" })
        .eq("id", id);
    }
  }

  await supabase.from("audit_trail").insert({
    contract_id: id,
    org_id: contract.org_id,
    user_id: user.id,
    action: `contract.${parsed.data.action === "sign" ? "signed" : "signature_declined"}`,
    details: { signer_email: parsed.data.signer_email, signer_name: parsed.data.signer_name },
  });

  return NextResponse.json({ message: parsed.data.action === "sign" ? "Contract signed" : "Signature declined" });
}