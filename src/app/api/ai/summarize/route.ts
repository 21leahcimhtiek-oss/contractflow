import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { summarizeContract } from "@/lib/openai/summarize-contract";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";

const summarizeSchema = z.object({
  content_md: z.string().min(100, "Content too short for summarization"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(aiRateLimit, `ai:summarize:${user.id}`);
  if (!rl.success) {
    return NextResponse.json({ error: "AI rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  try {
    const result = await summarizeContract(parsed.data.content_md);
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarization failed" },
      { status: 500 }
    );
  }
}