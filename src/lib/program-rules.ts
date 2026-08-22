export type ParticipantEligibility = {
  gender: "male" | "female";
  category: "junior" | "senior" | "super_senior";
};

export type ProgramEligibility = {
  gender_eligibility: "male" | "female" | "general";
  category_eligibility: "junior" | "senior" | "super_senior" | "general";
};

export function isProgramEligible(
  participant: ParticipantEligibility,
  program: ProgramEligibility
) {
  return (
    (program.gender_eligibility === "general" ||
      program.gender_eligibility === participant.gender) &&
    (program.category_eligibility === "general" ||
      program.category_eligibility === participant.category)
  );
}

export function canSelectMore(current: number, maximum = 4) {
  return Number.isInteger(current) && current >= 0 && current < maximum;
}

export function isSelectionOpen(
  now: Date,
  opens: string | null,
  closes: string | null
) {
  return (!opens || now >= new Date(opens)) && (!closes || now <= new Date(closes));
}

export function googlePrefillUrl(
  base: string,
  registrationKey: string | null,
  nameKey: string | null,
  registrationId: string,
  name: string
) {
  const url = new URL(base);
  if (registrationKey) url.searchParams.set(`entry.${registrationKey}`, registrationId);
  if (nameKey) url.searchParams.set(`entry.${nameKey}`, name);
  return url.toString();
}

export function isSwalathProgram(program?: {
  code?: string | null;
  name?: string | null;
  is_swalath_campaign?: boolean | null;
} | null): boolean {
  if (!program) return false;
  if (program.is_swalath_campaign === true) return true;
  const code = (program.code || "").toUpperCase();
  const name = (program.name || "").toUpperCase();
  return code === "FSS001" || code.startsWith("SWALATH") || name.includes("SWALATH");
}

export function generateCampaignDateList(
  startDate?: string | null,
  endDate?: string | null
): string[] {
  const startStr = startDate || "2026-08-22";
  const endStr = endDate || "2026-09-05";

  const start = new Date(`${startStr}T00:00:00+05:30`);
  const end = new Date(`${endStr}T00:00:00+05:30`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return ["2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"];
  }

  const dates: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, "0");
    const dd = String(curr.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export function formatDateDMY(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split("-");
    if (!y || !m || !d) return isoDate;
    return `${d}/${m}/${y}`;
  } catch {
    return isoDate;
  }
}

