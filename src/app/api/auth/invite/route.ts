import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { authRateLimit, checkRateLimit } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email(),
  org_id: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(authRateLimit, `invite:${user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", parsed.data.org_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Insufficient permissions to invite members" }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        org_id: parsed.data.org_id,
        role: parsed.data.role,
        invited_by: user.id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Invitation sent to ${parsed.data.email}` }, { status: 201 });
}