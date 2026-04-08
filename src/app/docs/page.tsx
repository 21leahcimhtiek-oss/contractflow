import Link from "next/link";

const sections = [
  {
    title: "Architecture",
    description: "System design, runtime, and core data model used by ContractFlow.",
  },
  {
    title: "API reference",
    description: "Contract, workflow, obligations, billing, and auth endpoints.",
  },
  {
    title: "Usage guide",
    description: "Operational flow from signup to renewals and billing.",
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <p className="text-sm font-medium text-aurora-700">ContractFlow Docs</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Product documentation</h1>
          <p className="text-gray-600 mt-3">
            ContractFlow documentation is included in this repository under the <code>docs/</code>{" "}
            directory and summarized below.
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="aurora-card p-5">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-600 mt-2">{section.description}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-aurora-600 text-white text-sm font-medium hover:bg-aurora-700"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
