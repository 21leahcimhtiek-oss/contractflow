import OpenAI from "openai";
import type { AiReviewResult } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert contract attorney with 20 years of experience reviewing commercial contracts. 
Your task is to analyze the provided contract and identify:
1. Risky or unfavorable clauses that could expose the party to liability
2. Missing standard clauses (e.g., limitation of liability, IP ownership, termination, governing law)
3. Vague or ambiguous language that needs clarification
4. Opportunities to negotiate better terms

You must respond with a JSON object matching this exact schema:
{
  "risk_score": number (0-100, where 0=no risk, 100=extreme risk),
  "summary": string (2-3 sentence executive summary of findings),
  "findings": [
    {
      "id": string (unique identifier),
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "clause": string (clause name/section),
      "issue": string (description of the problem),
      "suggestion": string (recommended fix or negotiation point),
      "affected_text": string (optional, the specific text that is problematic)
    }
  ],
  "missing_clauses": string[] (list of standard clauses that are absent),
  "positive_aspects": string[] (well-drafted or favorable provisions)
}

Be thorough but concise. Focus on material risks, not minor stylistic issues.`;

async function reviewWithRetry(content: string, attempt = 0): Promise<AiReviewResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Please review this contract and provide your analysis:\n\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Validate and normalize
    return {
      risk_score: Math.min(100, Math.max(0, Number(result.risk_score) || 50)),
      summary: String(result.summary || "Review complete."),
      findings: Array.isArray(result.findings)
        ? result.findings.map((f: Record<string, string>, i: number) => ({
            id: f.id || `finding-${i}`,
            severity: ["critical", "high", "medium", "low", "info"].includes(f.severity)
              ? f.severity
              : "medium",
            clause: String(f.clause || "Unknown"),
            issue: String(f.issue || ""),
            suggestion: String(f.suggestion || ""),
            affected_text: f.affected_text ? String(f.affected_text) : undefined,
          }))
        : [],
      missing_clauses: Array.isArray(result.missing_clauses)
        ? result.missing_clauses.map(String)
        : [],
      positive_aspects: Array.isArray(result.positive_aspects)
        ? result.positive_aspects.map(String)
        : [],
    };
  } catch (error) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      return reviewWithRetry(content, attempt + 1);
    }
    throw error;
  }
}

export async function reviewContract(contractContent: string): Promise<AiReviewResult> {
  if (!contractContent || contractContent.trim().length < 100) {
    throw new Error("Contract content is too short for meaningful review");
  }

  // Truncate to ~80k chars to stay within context limits
  const truncated =
    contractContent.length > 80000 ? contractContent.slice(0, 80000) + "\n\n[Content truncated]" : contractContent;

  return reviewWithRetry(truncated);
}