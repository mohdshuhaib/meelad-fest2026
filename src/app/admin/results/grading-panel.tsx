"use client";
import { useState } from "react";
import { LoaderCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function GradingPanel({ pp }: { pp: any }) {
  const p = Array.isArray(pp.participants) ? pp.participants[0] : pp.participants;
  const [grade, setGrade] = useState(pp.result_grade || "None");
  const [position, setPosition] = useState(pp.result_position || "None");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function save() {
    setPending(true);
    setMessage("");
    const res = await fetch("/api/admin/results/award", {
      method: "POST",
      body: JSON.stringify({
        participant_program_id: pp.id,
        result_grade: grade,
        result_position: position,
      }),
    });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setMessage(e.message || "Failed to save result.");
    }
  }

  const hasResult = pp.result_points !== null && pp.result_points !== undefined;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-cream/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-serif text-lg font-semibold">{p.name}</p>
          <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald">
            {p.registration_id}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {p.district} • {p.category.replace("_", " ")}
        </p>

        {pp.swalath_total !== undefined && pp.swalath_total !== null && pp.swalath_total > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald/10 px-2.5 py-1 text-xs font-black text-emerald">
            <span>✨ Total Swalath Logged:</span>
            <span className="font-serif text-sm font-black">{pp.swalath_total.toLocaleString()}</span>
          </div>
        )}
        
        {hasResult && (
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald">
            <CheckCircle2 size={16} /> 
            Awarded {pp.result_points} points 
            (Grade {pp.result_grade !== "None" ? pp.result_grade : "-"} • {pp.result_position !== "None" ? pp.result_position : "-"})
          </div>
        )}
      </div>

      <div className="flex flex-1 items-end gap-3 sm:max-w-md">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Grade</label>
          <select 
            value={grade} 
            onChange={e => setGrade(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald"
          >
            <option value="None">None</option>
            <option value="A">A Grade</option>
            <option value="B">B Grade</option>
            <option value="C">C Grade</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Standing</label>
          <select 
            value={position} 
            onChange={e => setPosition(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald"
          >
            <option value="None">None</option>
            <option value="1st">1st Place</option>
            <option value="2nd">2nd Place</option>
            <option value="3rd">3rd Place</option>
          </select>
        </div>
        <button 
          onClick={save}
          disabled={pending || (grade === pp.result_grade && position === pp.result_position)}
          className="min-h-[42px] min-w-[80px] rounded-xl bg-emerald px-4 text-sm font-bold text-white transition-opacity disabled:opacity-40"
        >
          {pending ? <LoaderCircle size={18} className="mx-auto animate-spin" /> : "Save"}
        </button>
      </div>
      
      {message && <p className="w-full text-xs font-bold text-red-600 sm:w-auto">{message}</p>}
    </div>
  );
}
