-- ContractFlow Initial Schema
-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORG MEMBERS
-- ============================================================
CREATE TABLE org_members (
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('nda', 'msa', 'sow', 'employment', 'vendor', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'review', 'pending_signature', 'active', 'expired', 'terminated')
  ),
  content_md TEXT,
  ai_summary TEXT,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  value_usd NUMERIC(15, 2),
  counterparty_name TEXT,
  counterparty_email TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACT VERSIONS
-- ============================================================
CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_md TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, version_number)
);

-- ============================================================
-- SIGNATURES
-- ============================================================
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'signer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVAL WORKFLOWS
-- ============================================================
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected')),
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  current_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACT TEMPLATES
-- ============================================================
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nda', 'msa', 'sow', 'employment', 'vendor', 'other')),
  content_md TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_contracts_org_id ON contracts(org_id);
CREATE INDEX idx_contracts_status ON contracts(org_id, status);
CREATE INDEX idx_contracts_type ON contracts(org_id, type);
CREATE INDEX idx_contracts_end_date ON contracts(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX idx_signatures_contract_id ON signatures(contract_id);
CREATE INDEX idx_signatures_email ON signatures(signer_email);
CREATE INDEX idx_audit_trail_contract ON audit_trail(contract_id, created_at DESC);
CREATE INDEX idx_audit_trail_org ON audit_trail(org_id, created_at DESC);
CREATE INDEX idx_contract_versions_contract ON contract_versions(contract_id, version_number DESC);
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_comments_contract ON comments(contract_id, created_at);
CREATE INDEX idx_approval_workflows_contract ON approval_workflows(contract_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's orgs
CREATE OR REPLACE FUNCTION get_user_org_ids(p_user_id UUID)
RETURNS TABLE(org_id UUID) AS $$
  SELECT om.org_id FROM org_members om WHERE om.user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ORGS policies
CREATE POLICY "Users can view their orgs" ON orgs
  FOR SELECT USING (id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org owners/admins can update" ON orgs
  FOR UPDATE USING (
    id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- ORG MEMBERS policies
CREATE POLICY "Members can view org members" ON org_members
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can manage members" ON org_members
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- CONTRACTS policies
CREATE POLICY "Org members can view contracts" ON contracts
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can create contracts" ON contracts
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update contracts" ON contracts
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org admins can delete contracts" ON contracts
  FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- CONTRACT VERSIONS policies
CREATE POLICY "Org members can view versions" ON contract_versions
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Org members can create versions" ON contract_versions
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

-- SIGNATURES policies
CREATE POLICY "Org members can view signatures" ON signatures
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Anyone can sign (by email)" ON signatures
  FOR UPDATE USING (signer_email = auth.email());

CREATE POLICY "Org members can create signature requests" ON signatures
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

-- APPROVAL WORKFLOWS policies
CREATE POLICY "Org members can view workflows" ON approval_workflows
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can manage workflows" ON approval_workflows
  FOR ALL USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- COMMENTS policies
CREATE POLICY "Org members can view comments" ON comments
  FOR SELECT USING (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Org members can create comments" ON comments
  FOR INSERT WITH CHECK (
    contract_id IN (SELECT id FROM contracts WHERE org_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Comment authors can update" ON comments
  FOR UPDATE USING (user_id = auth.uid());

-- CONTRACT TEMPLATES policies
CREATE POLICY "Users can view public templates" ON contract_templates
  FOR SELECT USING (is_public = TRUE OR org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can create templates" ON contract_templates
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update their templates" ON contract_templates
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- AUDIT TRAIL policies (read-only for users, insert only via service role)
CREATE POLICY "Org members can view audit trail" ON audit_trail
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- ============================================================
-- SEED: Public contract templates
-- ============================================================
INSERT INTO contract_templates (name, type, content_md, variables, is_public) VALUES
(
  'Standard NDA',
  'nda',
  E'# Non-Disclosure Agreement\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of **{{effective_date}}** between **{{disclosing_party}}** ("Disclosing Party") and **{{receiving_party}}** ("Receiving Party").\n\n## 1. Definition of Confidential Information\n\n"Confidential Information" means any information disclosed by the Disclosing Party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.\n\n## 2. Obligations\n\nThe Receiving Party shall: (a) hold Confidential Information in strict confidence; (b) not disclose to third parties; (c) use only for the Purpose stated herein.\n\n## 3. Term\n\nThis Agreement shall remain in effect for **{{term_years}} years** from the Effective Date.\n\n## 4. Governing Law\n\nThis Agreement shall be governed by the laws of **{{governing_state}}**.',
  ''[{"name":"effective_date","type":"date","required":true},{"name":"disclosing_party","type":"text","required":true},{"name":"receiving_party","type":"text","required":true},{"name":"term_years","type":"number","required":true,"default":2},{"name":"governing_state","type":"text","required":true}]'',
  TRUE
),
(
  'Master Service Agreement',
  'msa',
  E'# Master Service Agreement\n\nThis Master Service Agreement ("Agreement") is entered into as of **{{effective_date}}** between **{{client_name}}** ("Client") and **{{vendor_name}}** ("Vendor").\n\n## 1. Services\n\nVendor shall provide services as described in mutually agreed Statements of Work.\n\n## 2. Payment Terms\n\nClient shall pay invoices within **{{payment_terms}} days** of receipt. Late payments accrue interest at 1.5% per month.\n\n## 3. Intellectual Property\n\nAll work product created under this Agreement is work-for-hire owned by Client, except Vendor''s pre-existing IP.\n\n## 4. Limitation of Liability\n\nNeither party shall be liable for indirect, incidental, or consequential damages. Total liability is capped at **{{liability_cap}}**.\n\n## 5. Term and Termination\n\nThis Agreement continues until terminated by either party with **{{notice_days}} days** written notice.',
  ''[{"name":"effective_date","type":"date","required":true},{"name":"client_name","type":"text","required":true},{"name":"vendor_name","type":"text","required":true},{"name":"payment_terms","type":"number","required":true,"default":30},{"name":"liability_cap","type":"text","required":true,"default":"total fees paid in prior 3 months"},{"name":"notice_days","type":"number","required":true,"default":30}]'',
  TRUE
);