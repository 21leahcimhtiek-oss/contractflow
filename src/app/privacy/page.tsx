export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-3xl mx-auto aurora-card p-8 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-500">Last updated: January 1, 2026</p>
        <p className="text-gray-700">
          ContractFlow processes account, contract, and operational metadata to deliver contract
          lifecycle features. Customer content is scoped by organization access controls and
          protected with Supabase Row Level Security policies.
        </p>
        <p className="text-gray-700">
          We use third-party processors for infrastructure and billing (including Supabase, Vercel,
          OpenAI, Upstash, and Stripe). Contact support@contractflow.app for privacy inquiries.
        </p>
      </div>
    </main>
  );
}
