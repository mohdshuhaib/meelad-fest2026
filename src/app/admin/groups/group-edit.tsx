"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, X } from "lucide-react";

type EditableGroup = {
  id: string;
  name: string;
  whatsapp_group_link: string | null;
};

export function GroupEdit({ group }: { group: EditableGroup }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    
    const formData = new FormData(event.currentTarget);
    const body = {
      name: formData.get("name"),
      whatsappGroupLink: formData.get("whatsappGroupLink"),
    };

    const response = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setPending(false);
    
    if (!response.ok) {
      setError(result.message ?? "Group could not be updated.");
      return;
    }
    
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors"
        aria-label="Edit group"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/55 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-${group.id}`}
            className="my-4 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`edit-${group.id}`} className="font-serif text-2xl font-semibold">
                  Edit Group
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close edit dialog"
                className="grid size-10 place-items-center rounded-full bg-cream"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-bold">
                Group name
                <input
                  name="name"
                  required
                  defaultValue={group.name}
                  placeholder="GROUP NAME"
                  className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3 uppercase"
                />
              </label>

              <label className="block text-sm font-bold">
                WhatsApp group link
                <input
                  name="whatsappGroupLink"
                  type="url"
                  defaultValue={group.whatsapp_group_link ?? ""}
                  placeholder="WhatsApp group link (optional)"
                  className="mt-2 h-11 w-full rounded-xl border border-ink/15 px-3"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-11 rounded-full border px-5 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={pending}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-emerald px-6 text-sm font-bold text-white disabled:opacity-50"
                >
                  {pending && <LoaderCircle size={17} className="animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
