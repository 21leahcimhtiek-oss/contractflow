import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TemplateCard } from "@/components/TemplateCard";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const { data: templates } = await supabase
    .from("contract_templates")
    .select("*")
    .or(`is_public.eq.true,org_id.eq.${membership.org_id}`)
    .order("is_public", { ascending: false })
    .order("created_at", { ascending: false });

  const publicTemplates = (templates || []).filter((t: { is_public: boolean }) => t.is_public);
  const orgTemplates = (templates || []).filter((t: { is_public: boolean; org_id: string }) => !t.is_public && t.org_id === membership.org_id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Start from a template to speed up contract creation
          </p>
        </div>
        <Link
          href="/templates/new"
          className="inline-flex items-center gap-2 bg-aurora-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-aurora-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {orgTemplates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Organization&apos;s Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgTemplates.map((template: {
              id: string;
              name: string;
              type: string;
              variables: unknown[];
              is_public: boolean;
            }) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Public Templates ({publicTemplates.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {publicTemplates.map((template: {
            id: string;
            name: string;
            type: string;
            variables: unknown[];
            is_public: boolean;
          }) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}