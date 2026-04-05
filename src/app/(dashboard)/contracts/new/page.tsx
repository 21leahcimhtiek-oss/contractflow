"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2, FileText } from "lucide-react";
import { CONTRACT_TYPE_LABELS } from "@/types";

const newContractSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["nda", "msa", "sow", "employment", "vendor", "other"]),
  counterparty_name: z.string().optional(),
  counterparty_email: z.string().email("Invalid email").optional().or(z.literal("")),
  value_usd: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

type NewContractForm = z.infer<typeof newContractSchema>;

export default function NewContractPage() {
  const router = useRouter();
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewContractForm>({
    resolver: zodResolver(newContractSchema),
    defaultValues: { type: "nda" },
  });

  const contractType = watch("type");

  const handleAiDraft = async () => {
    setIsAiDrafting(true);
    setError(null);
    try {
      const formData = watch();
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          variables: {
            counterparty: formData.counterparty_name || "Counterparty Name",
            effective_date: formData.start_date || new Date().toISOString().split("T")[0],
            end_date: formData.end_date,
            value: formData.value_usd,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Store draft content and redirect to create with content
      sessionStorage.setItem("ai_draft_content", data.content_md);
      router.push(`/contracts/new?ai_draft=1&type=${formData.type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setIsAiDrafting(false);
    }
  };

  const onSubmit = async (data: NewContractForm) => {
    setError(null);
    const aiContent = sessionStorage.getItem("ai_draft_content");

    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        value_usd: data.value_usd ? parseFloat(data.value_usd) : null,
        content_md: aiContent || null,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Failed to create contract");
      return;
    }

    sessionStorage.removeItem("ai_draft_content");
    router.push(`/contracts/${result.data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Contract</h1>
        <p className="text-gray-600 text-sm mt-0.5">Fill in the details to create a new contract</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contract type */}
        <div className="aurora-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Contract Type</h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CONTRACT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
              <label
                key={value}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  contractType === value
                    ? "border-aurora-500 bg-aurora-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input {...register("type")} type="radio" value={value} className="sr-only" />
                <FileText className={`w-5 h-5 ${contractType === value ? "text-aurora-600" : "text-gray-400"}`} />
                <span className={`text-xs font-medium ${contractType === value ? "text-aurora-700" : "text-gray-600"}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="aurora-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Contract Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              {...register("title")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              placeholder="e.g. NDA with Acme Corp"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Counterparty Name</label>
              <input
                {...register("counterparty_name")}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Counterparty Email</label>
              <input
                {...register("counterparty_email")}
                type="email"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                placeholder="legal@acme.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract Value ($)</label>
              <input
                {...register("value_usd")}
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                {...register("start_date")}
                type="date"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input
                {...register("end_date")}
                type="date"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500 resize-none"
              placeholder="Brief description of this contract..."
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAiDraft}
            disabled={isAiDrafting || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 border-2 border-aurora-500 text-aurora-600 rounded-lg font-semibold text-sm hover:bg-aurora-50 disabled:opacity-50 transition-colors"
          >
            {isAiDrafting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isAiDrafting ? "Generating..." : "AI Draft"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isAiDrafting}
            className="flex-1 flex items-center justify-center gap-2 bg-aurora-600 text-white py-3 px-6 rounded-lg font-semibold text-sm hover:bg-aurora-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? "Creating..." : "Create Contract"}
          </button>
        </div>
      </form>
    </div>
  );
}