"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PenLine,
  GitBranch,
  BarChart3,
  BookTemplate,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  user: { email: string; id: string };
  org: { id: string; name: string; plan: string } | null;
  role: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/signatures", label: "Signatures", icon: PenLine },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/templates", label: "Templates", icon: BookTemplate },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user, org, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg aurora-bg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">ContractFlow</span>
        </Link>
      </div>

      {/* Org switcher */}
      {org && (
        <div className="px-4 py-3 border-b border-gray-100">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-aurora-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-aurora-700">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-medium text-gray-900 truncate">{org.name}</div>
                <div className="text-xs text-gray-400 capitalize">{org.plan} plan</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "sidebar-link-active" : "sidebar-link"}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "sidebar-link-active" : "sidebar-link"}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
        <div className="pt-2 border-t border-gray-100 mt-2">
          <div className="px-3 py-1.5 mb-1">
            <div className="text-xs text-gray-900 font-medium truncate">{user.email}</div>
            <div className="text-xs text-gray-400 capitalize">{role}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}