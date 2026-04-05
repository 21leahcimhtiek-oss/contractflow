import Link from "next/link";
import { BookTemplate, Code2 } from "lucide-react";
import type { ContractTemplate } from "@/types";
import { CONTRACT_TYPE_LABELS } from "@/types";

interface TemplateCardProps {
  template: ContractTemplate;
  onUse?: (template: ContractTemplate) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const variableCount = Object.keys(template.variables ?? {}).length;

  return (
    <div className="aurora-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 bg-aurora-100 rounded-lg flex items-center justify-center">
          <BookTemplate className="w-4 h-4 text-aurora-600" />
        </div>
        <span className={`status-badge ${template.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {template.is_public ? "Public" : "Private"}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-gray-400">{CONTRACT_TYPE_LABELS[template.type]}</span>
          {variableCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Code2 className="w-3 h-3" />
              {variableCount} variable{variableCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => onUse?.(template)}
          className="flex-1 bg-aurora-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-aurora-700 transition-colors"
        >
          Use Template
        </button>
        <Link
          href={`/contracts/new?template=${template.id}`}
          className="flex-1 border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          Preview
        </Link>
      </div>
    </div>
  );
}