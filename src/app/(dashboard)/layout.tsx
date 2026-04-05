import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(id, name, plan)")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        user={{ email: user.email || "", id: user.id }}
        org={membership?.orgs as { id: string; name: string; plan: string } | null}
        role={membership?.role || "member"}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}