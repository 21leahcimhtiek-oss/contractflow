import "@testing-library/jest-dom";

// Set dummy env vars for testing (before module imports)
process.env.OPENAI_API_KEY = "test-key-for-jest";
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

// Mock OpenAI module
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({ risk_score: 50, summary: "Test", findings: [], missing_clauses: [], positive_aspects: [] }) } }],
        }),
      },
    },
  }));
});

// Mock rate limiting
jest.mock("@/lib/rate-limit", () => ({
  standardRateLimit: { limit: jest.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() }) },
  aiRateLimit: { limit: jest.fn().mockResolvedValue({ success: true, remaining: 5, reset: Date.now() }) },
  authRateLimit: { limit: jest.fn().mockResolvedValue({ success: true, remaining: 5, reset: Date.now() }) },
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() }),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning:")) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});