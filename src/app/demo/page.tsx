import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-sm font-medium text-aurora-700">Interactive demo</p>
        <h1 className="text-3xl font-bold text-gray-900">See ContractFlow in action</h1>
        <p className="text-gray-600">
          ContractFlow automates contract drafting, risk review, approvals, and renewals in one
          workspace. Start a free account to try the full workflow end-to-end.
        </p>

        <div className="aurora-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Demo walkthrough</h2>
          <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-2">
            <li>Create a contract or upload an existing agreement.</li>
            <li>Run AI analysis to extract clauses and compute risk score.</li>
            <li>Start an approval workflow and collect signatures.</li>
            <li>Track obligations and renewal reminders automatically.</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-aurora-600 text-white text-sm font-medium hover:bg-aurora-700"
          >
            Start free trial
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
