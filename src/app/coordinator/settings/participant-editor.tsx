"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Person = {
  id: string;
  name: string;
  registration_id: string;
  category: string;
  gender: string;
  whatsapp_number: string;
  phone_number: string;
  date_of_birth: string;
  age: number;
  index: number;
};

function whatsappUrl(person: Person) {
  const text = encodeURIComponent(
    `ASSALAMU ALAIKUM ${person.name}. I AM YOUR AHLU SAADA MEELAD FEST COORDINATOR. REGISTRATION ID: ${person.registration_id}.`,
  );
  return `https://wa.me/91${person.whatsapp_number}?text=${text}`;
}

export function ParticipantEditor({ person }: { person: Person }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch(`/api/coordinator/participants/${person.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    if (!r.ok) {
      setError((await r.json()).message);
      return;
    }
    setEdit(false);
    router.refresh();
  }
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold text-gold">
            {person.index} · {person.registration_id}
          </p>
          <b>{person.name}</b>
          <p className="text-xs text-muted">
            {person.gender} · {person.category} · DOB {person.date_of_birth} ·
            Age {person.age}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl(person)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-full bg-[#1fa855] px-4 text-xs font-bold text-white"
          >
            WhatsApp message
          </a>
          <button
            onClick={() => setEdit(!edit)}
            className="rounded-full border border-emerald px-4 text-sm font-bold text-emerald"
          >
            {edit ? "Cancel" : "Edit contact"}
          </button>
        </div>
      </div>
      {edit && (
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            defaultValue={person.name}
            className="h-10 rounded-lg border px-3 uppercase"
          />
          <input
            name="whatsapp_number"
            defaultValue={person.whatsapp_number}
            className="h-10 rounded-lg border px-3"
          />
          <input
            name="phone_number"
            defaultValue={person.phone_number}
            className="h-10 rounded-lg border px-3"
          />
          <button className="rounded-lg bg-emerald py-2 text-sm font-bold text-white sm:col-start-3">
            Save allowed fields
          </button>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </form>
      )}
    </div>
  );
}
