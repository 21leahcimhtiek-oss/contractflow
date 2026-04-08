import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  standardRateLimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() }),
}));

import { POST } from "@/app/api/contracts/[id]/sign/route";
import { createClient } from "@/lib/supabase/server";

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

const mockUser = { id: "user-1", email: "signer@example.com" };
const mockOrg = { id: "org-1", plan: "starter" };
const mockMembership = { org_id: "org-1", role: "member", orgs: mockOrg };
const mockContract = {
  id: "contract-1",
  org_id: "org-1",
  status: "pending_signature",
};

describe("POST /api/contracts/[id]/sign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest("http://localhost/api/contracts/c1/sign", {
      method: "POST",
      body: JSON.stringify({ signer_email: "test@example.com", signer_name: "Test", action: "sign", role: "signatory" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid action", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({ data: mockMembership, error: null })
        .mockResolvedValueOnce({ data: mockContract, error: null }),
    });

    const req = new NextRequest("http://localhost/api/contracts/c1/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signer_email: "test@example.com", signer_name: "Test", action: "invalid", role: "signatory" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when contract not found", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    });

    const req = new NextRequest("http://localhost/api/contracts/notexist/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signer_email: "test@example.com", signer_name: "Test", action: "sign", role: "signatory" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "notexist" }) });
    expect(res.status).toBe(404);
  });
});