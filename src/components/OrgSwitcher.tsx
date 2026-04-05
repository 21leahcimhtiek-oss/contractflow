"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Building2, Plus } from "lucide-react";

interface Org {
  id: string;
  name: string;
  plan: string;
}

interface OrgSwitcherProps {
  currentOrg: Org | null;
  orgs: Org[];
  onSwitch: (orgId: string) => void;
}

export function OrgSwitcher({ currentOrg, orgs, onSwitch }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!currentOrg) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-6 h-6 bg-aurora-100 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-aurora-700">
            {currentOrg.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
          {currentOrg.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1">
          <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wide font-semibold">
            Your Organizations
          </div>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                onSwitch(org.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                org.id === currentOrg.id ? "bg-aurora-50" : ""
              }`}
            >
              <div className="w-7 h-7 bg-aurora-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-aurora-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                <div className="text-xs text-gray-400 capitalize">{org.plan}</div>
              </div>
              {org.id === currentOrg.id && (
                <div className="w-1.5 h-1.5 bg-aurora-500 rounded-full ml-auto" />
              )}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-gray-500">
              <div className="w-7 h-7 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
              <span className="text-sm">Create organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}