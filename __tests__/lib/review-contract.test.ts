// Set OPENAI_API_KEY before importing the module
process.env.OPENAI_API_KEY = "test-key";

import { reviewContract } from "@/lib/openai/review-contract";

describe("reviewContract fallback", () => {
  beforeEach(() => {
    // Clear the key to test fallback behavior
    process.env.OPENAI_API_KEY = "";
  });

  afterAll(() => {
    // Restore a test key
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns high risk findings for risky language", async () => {
    const result = await reviewContract(
      "This agreement includes unlimited liability and auto-renew terms. " +
        "Termination and governing law are omitted. Payment obligations are broad and " +
        "there is no liability cap for either party."
    );

    expect(result.risk_score).toBeGreaterThanOrEqual(50);
    expect(result.findings.some((finding) => finding.clause === "Liability")).toBe(true);
  });

  it("lists missing clauses for sparse contracts", async () => {
    const result = await reviewContract(
      "This contract describes services and payment terms in general language, but it " +
        "does not include governing law, liability limitation, or clear termination rights."
    );

    expect(result.missing_clauses.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
