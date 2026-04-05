import OpenAI from "openai";
import type { ContractType, AiDraftResult } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONTRACT_DRAFTING_PROMPTS: Record<string, string> = {
  nda: `You are drafting a Non-Disclosure Agreement. Include: definition of confidential information, obligations of receiving party, permitted disclosures, term and termination, return of materials, remedies (injunctive relief), governing law.`,
  msa: `You are drafting a Master Service Agreement. Include: services description, payment terms, intellectual property ownership, warranties and disclaimers, limitation of liability, indemnification, confidentiality, term and termination, governing law, dispute resolution.`,
  sow: `You are drafting a Statement of Work. Include: project scope, deliverables with acceptance criteria, timeline/milestones, fees and payment schedule, change order process, dependencies, assumptions.`,
  employment: `You are drafting an Employment Agreement. Include: position and duties, compensation and benefits, at-will employment (if applicable), confidentiality, non-solicitation, IP assignment, termination conditions, governing law.`,
  vendor: `You are drafting a Vendor Agreement. Include: products/services, pricing and payment, delivery terms, warranties, liability limitations, compliance requirements, termination rights, audit rights.`,
  other: `You are drafting a commercial contract. Include appropriate standard clauses for the contract type described.`,
};

export async function draftContract(
  type: ContractType,
  variables: Record<string, string>,
  templateContent?: string
): Promise<AiDraftResult> {
  const typePrompt = CONTRACT_DRAFTING_PROMPTS[type] || CONTRACT_DRAFTING_PROMPTS.other;

  const variablesText = Object.entries(variables)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const systemPrompt = `You are an expert contract drafter. ${typePrompt}

Draft a complete, professional contract in Markdown format. Use clear section headings (##), numbered clauses, and professional legal language.

The contract should be:
- Legally complete with all necessary provisions
- Clear and unambiguous
- Balanced and fair to both parties
- Ready for review by attorneys

Respond with a JSON object:
{
  "content_md": string (the full contract in Markdown),
  "variables_used": object (key-value of all variables incorporated),
  "notes": string (any assumptions made or recommendations for the parties)
}`;

  const userPrompt = templateContent
    ? `Fill in and complete this contract template with the provided variables:\n\nVariables:\n${variablesText}\n\nTemplate:\n${templateContent}`
    : `Draft a ${type.toUpperCase()} with these details:\n\nVariables:\n${variablesText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 6000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      content_md: String(result.content_md || ""),
      variables_used: result.variables_used || variables,
      notes: String(result.notes || ""),
    };
  } catch (error) {
    throw new Error(`Failed to draft contract: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}