import Link from "next/link";
import { FileText, Calendar, DollarSign } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Contract, ContractStatus } from "@/types";
import { CONTRACT_TYPE_LABELS } from "@/types";

interface ContractCardProps {
  contract: Contract;
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  review: { label: "In Review", className: "bg-blue-100 text-blue-700" },
  pending_signature: { label: "Pending Signature", className: "bg-yellow-100 text-yellow-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  expired: { label: "Expired", className: "bg-red-100 text-red-700" },
  terminated: { label: "Terminated", className: "bg-gray-100 text-gray-500" },
};

export function ContractCard({ contract }: ContractCardProps) {
  const status = statusConfig[contract.status];
  const daysLeft = contract.end_date
    ? differenceInDays(new Date(contract.end_date), new Date())
    : null;

  return (
    <Link href={`/contracts/${contract.id}`} className="aurora-card p-5 block hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-aurora-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-aurora-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{contract.title}</div>
            <div className="text-xs text-gray-500">{CONTRACT_TYPE_LABELS[contract.type]}</div>
          </div>
        </div>
        <span className={`status-badge flex-shrink-0 ml-2 ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        {contract.counterparty_name && (
          <span className="truncate max-w-[120px]">{contract.counterparty_name}</span>
        )}
        {contract.value_usd && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {contract.value_usd.toLocaleString()}
          </span>
        )}
        {daysLeft !== null && (
          <span className={`flex items-center gap-1 ${daysLeft <= 30 ? "text-red-500 font-medium" : ""}`}>
            <Calendar className="w-3 h-3" />
            {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </Link>
  );
}