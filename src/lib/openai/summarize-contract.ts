import OpenAI from "openai";
import type { AiSummaryResult } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a legal analyst who specializes in extracting key information from contracts for executive summaries.

Analyze the provided contract and extract:
1. A plain-language executive summary (2-3 sentences)
2. Key terms (payment amounts, rates, quantities, etc.)
3. Obligations of each party
4. Important dates (effective date, expiration, deadlines, milestones)
5. Total contract value (if mentioned)
6. Risk flags (anything that stands out as unusual or concerning)

Respond with JSON matching:
{
  "summary": string,
  "key_terms": string[],
  "obligations": string[],
  "important_dates": [{"label": string, "date": string}],
  "total_value": string (optional, e.g. "$50,000" or "Not specified"),
  "risk_flags": string[]
}`;

export async function summarizeContract(contractContent: string): Promise<AiSummaryResult> {
  const truncated =
    contractContent.length > 30000 ? contractContent.slice(0, 30000) + "\n\n[Truncated]" : contractContent;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please summarize this contract:\n\n${truncated}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2000,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    summary: String(result.summary || ""),
    key_terms: Array.isArray(result.key_terms) ? result.key_terms.map(String) : [],
    obligations: Array.isArray(result.obligations) ? result.obligations.map(String) : [],
    important_dates: Array.isArray(result.important_dates)
      ? result.important_dates.map((d: Record<string, string>) => ({
          label: String(d.label || ""),
          date: String(d.date || ""),
        }))
      : [],
    total_value: result.total_value ? String(result.total_value) : undefined,
    risk_flags: Array.isArray(result.risk_flags) ? result.risk_flags.map(String) : [],
  };
}