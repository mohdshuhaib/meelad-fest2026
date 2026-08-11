"use client";
import { useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResetButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!confirm("Are you sure you want to reset this participant's submission state? This will allow them to open the form again.")) return;
    setPending(true);
    const res = await fetch(`/api/admin/resets/${id}`, { method: "POST" });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      const error = await res.json().catch(() => ({}));
      alert(error.message || "Failed to reset form state.");
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={pending}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-amber-100 px-3 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-200 disabled:opacity-50"
    >
      {pending ? <LoaderCircle className="animate-spin" size={16} /> : <RotateCcw size={16} />}
      Reset
    </button>
  );
}
