import { reviewContract } from "@/lib/openai/review-contract";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import OpenAI from "openai";

describe("reviewContract", () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const instance = new (OpenAI as jest.MockedClass<typeof OpenAI>)();
    mockCreate = instance.chat.completions.create as jest.Mock;
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as any);
  });

  it("returns review result with risk_score and findings", async () => {
    const mockResult = {
      risk_score: 65,
      summary: "Standard NDA with moderate risk",
      findings: [
        {
          severity: "medium",
          clause: "Section 3 - Confidentiality",
          issue: "Broad definition of confidential information",
          suggestion: "Narrow the definition to specific categories",
        },
      ],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockResult),
          },
        },
      ],
    });

    const result = await reviewContract("This is a test NDA contract content.");

    expect(result).toBeDefined();
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it("handles API errors with retry", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("API Error"))
      .mockRejectedValueOnce(new Error("API Error"))
      .mockRejectedValueOnce(new Error("Final Error"));

    await expect(reviewContract("Test contract")).rejects.toThrow();
  });

  it("normalizes out-of-range risk scores", async () => {
    const mockResult = {
      risk_score: 150, // out of range
      summary: "High risk contract",
      findings: [],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockResult) } }],
    });

    const result = await reviewContract("Test contract");
    expect(result.risk_score).toBeLessThanOrEqual(100);
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
  });
});