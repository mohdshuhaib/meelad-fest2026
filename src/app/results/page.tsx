import { createAdminClient } from "@/lib/supabase/admin";
import { DISTRICTS } from "@/lib/constants";
import { ResultsClient, ResultsDataPayload, DistrictLeaderEntry, IndividualLeaderEntry } from "./results-client";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

// ISR: Cache statically and revalidate at most once every 60 seconds in the background
// This handles 2,000+ concurrent visitors with virtually zero database/disk load.
export const revalidate = 60;

export default async function ResultsPage() {
  const db = createAdminClient();

  // Fetch only necessary lightweight fields
  const [participantsRes, ppRes, programsRes, settingsRes] = await Promise.all([
    db
      .from("participants")
      .select("id, registration_id, name, district, gender, category")
      .eq("is_active", true),
    db
      .from("participant_programs")
      .select("participant_id, program_id, result_points, verification_status"),
    db
      .from("programs")
      .select("id, category_eligibility, gender_eligibility"),
    db
      .from("app_settings")
      .select("maximum_programs_per_participant")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const rawParticipants = participantsRes.data || [];
  const rawPP = ppRes.data || [];
  const rawPrograms = programsRes.data || [];
  const maxProgs = settingsRes.data?.maximum_programs_per_participant ?? 4;

  // Build program lookup for eligibility counts
  const countEligiblePrograms = (category: string, gender: string) => {
    return rawPrograms.filter(
      (p) =>
        (p.category_eligibility === "general" || p.category_eligibility === category) &&
        (p.gender_eligibility === "general" || p.gender_eligibility === gender)
    ).length;
  };

  // Map participant_programs by participant_id
  const participantProgramsMap = new Map<string, { totalPoints: number; count: number }>();
  let totalPointsFest = 0;
  let totalSubmissionsFest = 0;

  for (const pp of rawPP) {
    const points = typeof pp.result_points === "number" ? pp.result_points : 0;
    const existing = participantProgramsMap.get(pp.participant_id) || { totalPoints: 0, count: 0 };
    existing.totalPoints += points;
    existing.count += 1;
    participantProgramsMap.set(pp.participant_id, existing);

    totalPointsFest += points;
    totalSubmissionsFest += 1;
  }

  // Pre-process all participants
  const processedParticipants = rawParticipants.map((p) => {
    const progData = participantProgramsMap.get(p.id) || { totalPoints: 0, count: 0 };
    const eligibleCount = countEligiblePrograms(p.category, p.gender);
    const totalAvail = maxProgs ? Math.min(maxProgs, eligibleCount || maxProgs) : eligibleCount || 4;

    return {
      id: p.id,
      registrationId: p.registration_id,
      name: p.name,
      district: p.district,
      gender: p.gender as "male" | "female",
      category: p.category as "junior" | "senior" | "super_senior",
      totalPoints: progData.totalPoints,
      participatedCount: progData.count,
      totalAvailablePrograms: totalAvail,
    };
  });

  // Helper to build ranked individual list
  function buildIndividualList(
    category: "junior" | "senior" | "super_senior",
    genderFilter: "all" | "male" | "female"
  ): IndividualLeaderEntry[] {
    const filtered = processedParticipants.filter((p) => {
      if (p.category !== category) return false;
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;
      return true;
    });

    // Sort by points descending, then participated count, then name
    filtered.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.participatedCount !== a.participatedCount) return b.participatedCount - a.participatedCount;
      return a.name.localeCompare(b.name);
    });

    let currentRank = 1;
    return filtered.map((p, idx) => {
      if (idx > 0 && p.totalPoints < filtered[idx - 1].totalPoints) {
        currentRank = idx + 1;
      }
      return {
        ...p,
        rank: currentRank,
      };
    });
  }

  // Helper to build ranked district list
  function buildDistrictList(
    categoryFilter: "all" | "junior" | "senior" | "super_senior",
    genderFilter: "all" | "male" | "female"
  ): DistrictLeaderEntry[] {
    const districtStats = new Map<string, { totalPoints: number; participantsCount: number; programmesCount: number }>();

    // Initialize all official districts
    for (const d of DISTRICTS) {
      districtStats.set(d, { totalPoints: 0, participantsCount: 0, programmesCount: 0 });
    }

    for (const p of processedParticipants) {
      if (categoryFilter !== "all" && p.category !== categoryFilter) continue;
      if (genderFilter !== "all" && p.gender !== genderFilter) continue;

      const stat = districtStats.get(p.district) || { totalPoints: 0, participantsCount: 0, programmesCount: 0 };
      stat.totalPoints += p.totalPoints;
      stat.participantsCount += 1;
      stat.programmesCount += p.participatedCount;
      districtStats.set(p.district, stat);
    }

    const list: DistrictLeaderEntry[] = [];
    for (const [district, stat] of districtStats.entries()) {
      list.push({
        district,
        totalPoints: stat.totalPoints,
        participantsCount: stat.participantsCount,
        programmesCount: stat.programmesCount,
        rank: 1,
      });
    }

    // Sort by totalPoints descending, then programmesCount descending, then participantsCount
    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.programmesCount !== a.programmesCount) return b.programmesCount - a.programmesCount;
      return b.participantsCount - a.participantsCount;
    });

    let currentRank = 1;
    return list.map((d, idx) => {
      if (idx > 0 && d.totalPoints < list[idx - 1].totalPoints) {
        currentRank = idx + 1;
      }
      return {
        ...d,
        rank: currentRank,
      };
    });
  }

  // Compile full pre-calculated payload
  const overallDistricts = buildDistrictList("all", "all");
  const leadingDistrict = overallDistricts[0]?.district || "—";
  const leadingDistrictPoints = overallDistricts[0]?.totalPoints || 0;

  const payload: ResultsDataPayload = {
    districtOverall: {
      all: overallDistricts,
      male: buildDistrictList("all", "male"),
      female: buildDistrictList("all", "female"),
    },
    districtCategory: {
      junior: {
        all: buildDistrictList("junior", "all"),
        male: buildDistrictList("junior", "male"),
        female: buildDistrictList("junior", "female"),
      },
      senior: {
        all: buildDistrictList("senior", "all"),
        male: buildDistrictList("senior", "male"),
        female: buildDistrictList("senior", "female"),
      },
      super_senior: {
        all: buildDistrictList("super_senior", "all"),
        male: buildDistrictList("super_senior", "male"),
        female: buildDistrictList("super_senior", "female"),
      },
    },
    individualCategory: {
      junior: {
        all: buildIndividualList("junior", "all"),
        male: buildIndividualList("junior", "male"),
        female: buildIndividualList("junior", "female"),
      },
      senior: {
        all: buildIndividualList("senior", "all"),
        male: buildIndividualList("senior", "male"),
        female: buildIndividualList("senior", "female"),
      },
      super_senior: {
        all: buildIndividualList("super_senior", "all"),
        male: buildIndividualList("super_senior", "male"),
        female: buildIndividualList("super_senior", "female"),
      },
    },
    stats: {
      totalPoints: totalPointsFest,
      totalActiveParticipants: rawParticipants.length,
      totalSubmissions: totalSubmissionsFest,
      leadingDistrict,
      leadingDistrictPoints,
    },
  };

  return (
    <main className="min-h-screen bg-[#f5f0e4] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-ink shadow-sm ring-1 ring-ink/10 backdrop-blur transition-all hover:bg-white hover:text-emerald"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Home
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald">
              Live Fest Standings
            </span>
          </div>
        </div>

        {/* Page Header */}
        <header className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-xs font-black uppercase tracking-[.25em] text-emerald shadow-sm">
            <Trophy size={15} className="text-gold" />
            Official Fest Standings
          </div>
          <h1 className="mt-3 font-serif text-4xl font-extrabold text-ink sm:text-5xl lg:text-6xl">
            Results & Leaderboards
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-muted sm:text-base">
            Live standings for Ahlu Saada Islamic Fest 2026 across Junior, Senior & Super Senior divisions with individual and district lead scores.
          </p>
        </header>

        {/* Interactive Client Component */}
        <ResultsClient data={payload} />
      </div>
    </main>
  );
}
