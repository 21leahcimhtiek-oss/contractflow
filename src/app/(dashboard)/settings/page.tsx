import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { Users, Bell, Shield, Building } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(id, name, plan)")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, created_at, profiles:user_id(email)")
    .eq("org_id", membership.org_id)
    .order("created_at");

  const org = membership.orgs as { id: string; name: string; plan: string } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-0.5">Manage your organization and preferences</p>
      </div>

      {/* Organization */}
      <section className="aurora-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Organization</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
            <div className="flex gap-2">
              <input
                defaultValue={org?.name}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
              <button className="px-4 py-2.5 bg-aurora-600 text-white text-sm font-semibold rounded-lg hover:bg-aurora-700">
                Save
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <span className="inline-block bg-aurora-100 text-aurora-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {org?.plan} Plan
            </span>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="aurora-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Team Members ({members?.length || 0})</h2>
          </div>
          {(membership.role === "owner" || membership.role === "admin") && (
            <form action="/api/auth/invite" method="POST">
              <button
                type="submit"
                className="text-sm bg-aurora-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-aurora-700"
              >
                Invite Member
              </button>
            </form>
          )}
        </div>
        <div className="space-y-3">
          {(members || []).map((member: {
            user_id: string;
            role: string;
            created_at: string;
            profiles: { email: string } | null;
          }) => (
            <div key={member.user_id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.profiles?.email || "Unknown"}
                  {member.user_id === user.id && (
                    <span className="text-xs text-gray-400 ml-1.5">(you)</span>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                member.role === "owner"
                  ? "bg-purple-100 text-purple-700"
                  : member.role === "admin"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="aurora-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            "Contract signature requests",
            "Contract approval requests",
            "Contract expiry reminders (30 days)",
            "New team member joins",
            "Contract status changes",
          ].map((pref) => (
            <label key={pref} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{pref}</span>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-aurora-600 focus:ring-aurora-500" />
            </label>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="aurora-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Current email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <button className="text-aurora-600 hover:text-aurora-700 font-medium">
            Change password
          </button>
        </div>
      </section>

      <OrgSwitcher orgId={membership.org_id} userId={user.id} />
    </div>
  );
}