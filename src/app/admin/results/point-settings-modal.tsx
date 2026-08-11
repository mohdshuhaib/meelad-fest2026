"use client";
import { useState } from "react";
import { X, Settings2, LoaderCircle } from "lucide-react";

export function PointSettingsModal({ initialRules }: { initialRules: any }) {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState(
    initialRules || {
      normal: { grades: { A: 5, B: 3, C: 1 }, positions: { "1st": 5, "2nd": 3, "3rd": 1 } },
      general: { grades: { A: 10, B: 8, C: 6 }, positions: { "1st": 5, "2nd": 3, "3rd": 1 } },
    }
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setPending(true);
    setMessage("");
    const res = await fetch("/api/admin/results/settings", {
      method: "POST",
      body: JSON.stringify(rules),
    });
    setPending(false);
    if (res.ok) {
      setOpen(false);
    } else {
      const e = await res.json().catch(() => ({}));
      setMessage(e.message || "Failed to save settings");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-[#103c35] transition-transform hover:scale-[1.02]"
      >
        <Settings2 size={18} /> Point Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">
                Point Settings
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-cream"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mt-2 text-sm text-muted">
              Configure the points awarded for Grades and Standings. This applies to newly awarded results.
            </p>

            <div className="mt-6 space-y-8">
              {(["normal", "general"] as const).map((cat) => (
                <div key={cat} className="space-y-4">
                  <h3 className="font-bold uppercase tracking-wider text-emerald border-b border-ink/10 pb-2">
                    {cat} Category
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Grades</p>
                      <div className="space-y-3">
                        {["A", "B", "C"].map((grade) => (
                          <label key={grade} className="flex items-center justify-between text-sm font-semibold">
                            Grade {grade}
                            <input
                              type="number"
                              value={rules[cat].grades[grade]}
                              onChange={(e) => setRules({
                                ...rules,
                                [cat]: {
                                  ...rules[cat],
                                  grades: { ...rules[cat].grades, [grade]: Number(e.target.value) }
                                }
                              })}
                              className="w-20 rounded-lg border border-ink/20 px-3 py-1.5 text-right outline-none focus:border-emerald"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Standings</p>
                      <div className="space-y-3">
                        {["1st", "2nd", "3rd"].map((pos) => (
                          <label key={pos} className="flex items-center justify-between text-sm font-semibold">
                            {pos} Place
                            <input
                              type="number"
                              value={rules[cat].positions[pos]}
                              onChange={(e) => setRules({
                                ...rules,
                                [cat]: {
                                  ...rules[cat],
                                  positions: { ...rules[cat].positions, [pos]: Number(e.target.value) }
                                }
                              })}
                              className="w-20 rounded-lg border border-ink/20 px-3 py-1.5 text-right outline-none focus:border-emerald"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {message && <p className="mt-4 text-sm font-bold text-red-600">{message}</p>}

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={pending}
                className="flex items-center gap-2 rounded-xl bg-emerald px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {pending && <LoaderCircle size={16} className="animate-spin" />} Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
