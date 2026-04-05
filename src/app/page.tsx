import Link from "next/link";
import {
  FileText,
  Shield,
  Zap,
  CheckCircle,
  Users,
  BarChart3,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Contract Drafting",
    description:
      "Generate complete, legally-sound contracts in seconds. GPT-4o fills templates with your variables and ensures all required clauses are present.",
  },
  {
    icon: Shield,
    title: "Automated Risk Scoring",
    description:
      "Every contract gets a 0-100 risk score with clause-level findings. Identify liability exposure, missing terms, and negotiation opportunities instantly.",
  },
  {
    icon: CheckCircle,
    title: "E-Signature Workflows",
    description:
      "Multi-party signing with complete audit trail. Automatically update contract status when all parties sign.",
  },
  {
    icon: Users,
    title: "Approval Chains",
    description:
      "Configurable multi-step approval workflows. Route contracts to legal, finance, and executive approvers with automatic notifications.",
  },
  {
    icon: FileText,
    title: "Version History",
    description:
      "Full contract version control with AI-generated change summaries. Compare versions and restore at any time.",
  },
  {
    icon: BarChart3,
    title: "Contract Analytics",
    description:
      "Dashboard with contract volume, risk distribution, time-to-sign metrics, and total value under management.",
  },
];

const testimonials = [
  {
    quote:
      "ContractFlow cut our contract cycle time from 3 weeks to 2 days. The AI risk scoring catches issues our legal team used to miss.",
    author: "Sarah Chen",
    title: "VP Legal Operations, TechCorp",
    rating: 5,
  },
  {
    quote:
      "We process 200+ vendor contracts per month. ContractFlow's templates and approval workflows have been transformative for our procurement team.",
    author: "Marcus Rodriguez",
    title: "Head of Procurement, Scale Inc.",
    rating: 5,
  },
  {
    quote:
      "The ROI was immediate. We closed our Series B 2 weeks faster because our investor agreements were ready in hours, not days.",
    author: "Emily Patel",
    title: "CEO, Founder @ NovaBuild",
    rating: 5,
  },
];

const pricing = [
  {
    name: "Starter",
    price: 79,
    description: "Perfect for small teams",
    contracts: "10 contracts",
    members: "3 team members",
    features: [
      "AI contract review",
      "Basic e-signature",
      "PDF export",
      "Email notifications",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 199,
    description: "For growing legal teams",
    contracts: "100 contracts",
    members: "15 team members",
    features: [
      "AI drafting + review",
      "Advanced e-signature",
      "Approval workflows",
      "Template library",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: 499,
    description: "Unlimited scale",
    contracts: "Unlimited contracts",
    members: "Unlimited members",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Custom workflows",
      "Dedicated support",
      "SLA guarantee",
      "API + webhooks",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg aurora-bg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">ContractFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="/docs" className="hover:text-gray-900">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-aurora-600 text-white px-4 py-2 rounded-lg hover:bg-aurora-700 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-aurora-50 text-aurora-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Contract Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            From draft to signed{" "}
            <span className="aurora-gradient-text">in minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            ContractFlow uses GPT-4o to draft, review, and risk-score contracts automatically.
            Multi-party e-signature, approval workflows, and real-time analytics — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-aurora-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-aurora-700 transition-colors shadow-lg"
            >
              Start 14-day free trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Watch demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "80%", label: "Faster contract cycles" },
            { value: "92min", label: "Saved per contract" },
            { value: "2,000+", label: "Enterprise customers" },
            { value: "99.9%", label: "Uptime SLA" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold aurora-gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything your legal team needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ContractFlow handles the full contract lifecycle — from AI-powered drafting to
              executed agreement — so your team can focus on strategy, not paperwork.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="aurora-card p-6">
                <div className="w-10 h-10 bg-aurora-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-aurora-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Trusted by legal teams at leading companies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.author}</div>
                  <div className="text-gray-500 text-xs">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-aurora-600 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="inline-block bg-white text-aurora-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    {plan.badge}
                  </div>
                )}
                <div className={`text-lg font-bold mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </div>
                <div className={`text-sm mb-4 ${plan.highlighted ? "text-aurora-200" : "text-gray-500"}`}>
                  {plan.description}
                </div>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-aurora-200" : "text-gray-500"}`}>/mo</span>
                </div>
                <div className={`text-sm mb-2 font-medium ${plan.highlighted ? "text-aurora-200" : "text-gray-600"}`}>
                  {plan.contracts} · {plan.members}
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-aurora-100" : "text-gray-600"}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-aurora-200" : "text-aurora-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? "bg-white text-aurora-600 hover:bg-aurora-50"
                      : "bg-aurora-600 text-white hover:bg-aurora-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="aurora-bg px-6 py-24 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your contract workflow?
          </h2>
          <p className="text-aurora-100 mb-8 text-lg">
            Join 2,000+ enterprise teams who cut contract cycle times by 80% with ContractFlow.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-aurora-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-aurora-50 transition-colors shadow-lg"
          >
            Start your free trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded aurora-bg flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">ContractFlow</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-gray-700">Privacy</a>
            <a href="/terms" className="hover:text-gray-700">Terms</a>
            <a href="/docs" className="hover:text-gray-700">Docs</a>
            <a href="mailto:support@contractflow.app" className="hover:text-gray-700">Support</a>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 ContractFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}