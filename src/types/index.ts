export type ContractType = "nda" | "msa" | "sow" | "employment" | "vendor" | "other";

export type ContractStatus =
  | "draft"
  | "review"
  | "pending_signature"
  | "active"
  | "expired"
  | "terminated";

export type OrgPlan = "starter" | "pro" | "enterprise";

export type OrgRole = "owner" | "admin" | "member" | "viewer";

export type SignatureStatus = "pending" | "signed" | "declined";

export type WorkflowStatus = "pending" | "in_progress" | "approved" | "rejected";

export interface Org {
  id: string;
  name: string;
  plan: OrgPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Contract {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  type: ContractType;
  status: ContractStatus;
  content_md: string | null;
  ai_summary: string | null;
  risk_score: number | null;
  value_usd: number | null;
  counterparty_name: string | null;
  counterparty_email: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  content_md: string;
  change_summary: string | null;
  created_by: string;
  created_at: string;
}

export interface Signature {
  id: string;
  contract_id: string;
  signer_email: string;
  signer_name: string;
  role: string;
  status: SignatureStatus;
  signed_at: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  approver_email: string;
  approver_name: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  acted_at?: string;
}

export interface ApprovalWorkflow {
  id: string;
  contract_id: string;
  org_id: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  current_step: number;
  created_at: string;
}

export interface Comment {
  id: string;
  contract_id: string;
  user_id: string;
  content: string;
  resolved: boolean;
  created_at: string;
}

export interface ContractTemplate {
  id: string;
  org_id: string | null;
  name: string;
  type: ContractType;
  content_md: string;
  variables: TemplateVariable[];
  is_public: boolean;
  created_at: string;
}

export interface TemplateVariable {
  name: string;
  type: "text" | "date" | "number" | "email";
  required: boolean;
  default?: string | number;
  description?: string;
}

export interface AuditEvent {
  id: string;
  contract_id: string | null;
  org_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// AI types
export interface AiReviewFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  clause: string;
  issue: string;
  suggestion: string;
  affected_text?: string;
}

export interface AiReviewResult {
  risk_score: number;
  summary: string;
  findings: AiReviewFinding[];
  missing_clauses: string[];
  positive_aspects: string[];
}

export interface AiDraftResult {
  content_md: string;
  variables_used: Record<string, string>;
  notes: string;
}

export interface AiSummaryResult {
  summary: string;
  key_terms: string[];
  obligations: string[];
  important_dates: Array<{ label: string; date: string }>;
  total_value?: string;
  risk_flags: string[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Plan limits
export interface PlanLimits {
  contracts: number; // -1 = unlimited
  team_members: number;
  templates: number;
  ai_reviews_per_month: number;
  storage_gb: number;
}

export const PLAN_LIMITS: Record<OrgPlan, PlanLimits> = {
  starter: {
    contracts: 10,
    team_members: 3,
    templates: 5,
    ai_reviews_per_month: 20,
    storage_gb: 5,
  },
  pro: {
    contracts: 100,
    team_members: 15,
    templates: 50,
    ai_reviews_per_month: 200,
    storage_gb: 50,
  },
  enterprise: {
    contracts: -1,
    team_members: -1,
    templates: -1,
    ai_reviews_per_month: -1,
    storage_gb: 500,
  },
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  nda: "NDA",
  msa: "Master Service Agreement",
  sow: "Statement of Work",
  employment: "Employment Agreement",
  vendor: "Vendor Agreement",
  other: "Other",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  review: "In Review",
  pending_signature: "Pending Signature",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
};