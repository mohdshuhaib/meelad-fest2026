import { createAdminClient } from "@/lib/supabase/admin";
import { DISTRICTS } from "@/lib/constants";
import {
  ResultsClient,
  ResultsDataPayload,
  DistrictLeaderEntry,
  IndividualLeaderEntry,
  PublishedProgramResult,
  ProgramWinnerEntry,
} from "./results-client";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

// Force 100% dynamic live rendering with zero caching so live results and database updates show immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to fetch all rows across all pages from Supabase (bypasses PostgREST 1,000 row default limit)
async function fetchAllRows<T>(
  fetcher: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allRows: T[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await fetcher(from, to);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data as T[]);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows;
}

export default async function ResultsPage() {
  const db = createAdminClient();

  // Fetch all active participants, all participant_programs across all pages, programs, and settings in parallel
  const [rawParticipants, rawPP, programsRes, settingsRes] = await Promise.all([
    fetchAllRows<{
      id: string;
      registration_id: string;
      name: string;
      district: string;
      gender: string;
      category: string;
    }>(async (from, to) =>
      await db
        .from("participants")
        .select("id, registration_id, name, district, gender, category")
        .eq("is_active", true)
        .is("deleted_at", null)
        .range(from, to)
    ),
    fetchAllRows<{
      id: string;
      participant_id: string;
      program_id: string;
      result_points: number | null;
      result_grade: string | null;
      result_position: string | null;
      verification_status: string;
    }>(async (from, to) =>
      await db
        .from("participant_programs")
        .select("id, participant_id, program_id, result_points, result_grade, result_position, verification_status")
        .range(from, to)
    ),
    db
      .from("programs")
      .select("id, code, name, category_eligibility, gender_eligibility")
      .order("code"),
    db
      .from("app_settings")
      .select("maximum_programs_per_participant, point_rules")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const rawPrograms = programsRes.data || [];
  const maxProgs = settingsRes.data?.maximum_programs_per_participant ?? 4;
  const pointRules = settingsRes.data?.point_rules;

  // Build program lookup for eligibility counts
  const countEligiblePrograms = (category: string, gender: string) => {
    return rawPrograms.filter(
      (p) =>
        (p.category_eligibility === "general" || p.category_eligibility === category) &&
        (p.gender_eligibility === "general" || p.gender_eligibility === gender)
    ).length;
  };

  // Participant quick lookup map
  const participantLookup = new Map<string, (typeof rawParticipants)[0]>();
  for (const p of rawParticipants) {
    participantLookup.set(p.id, p);
  }

  // Map participant_programs by participant_id to aggregate marks/points and awards
  const participantProgramsMap = new Map<
    string,
    {
      totalPoints: number;
      count: number;
      awardedCount: number;
      bestGrade: string | null;
      bestPosition: string | null;
      awardsList: string[];
    }
  >();

  let totalPointsFest = 0;
  let totalSubmissionsFest = 0;

  for (const pp of rawPP) {
    let points = typeof pp.result_points === "number" ? pp.result_points : 0;
    const hasGrade = Boolean(pp.result_grade && pp.result_grade !== "None");
    const hasPosition = Boolean(pp.result_position && pp.result_position !== "None");

    // Fallback point calculation if result_points is 0 but grade or position was awarded
    if (points === 0 && (hasGrade || hasPosition)) {
      const g = pp.result_grade;
      const p = pp.result_position;
      const gPts = g === "A" ? 5 : g === "B" ? 3 : g === "C" ? 1 : 0;
      const pPts = p === "1st" ? 5 : p === "2nd" ? 3 : p === "3rd" ? 1 : 0;
      points = gPts + pPts;
    }

    const existing = participantProgramsMap.get(pp.participant_id) || {
      totalPoints: 0,
      count: 0,
      awardedCount: 0,
      bestGrade: null,
      bestPosition: null,
      awardsList: [],
    };

    existing.totalPoints += points;
    existing.count += 1;

    if (points > 0 || hasGrade || hasPosition) {
      existing.awardedCount += 1;
      if (hasPosition && pp.result_position) {
        existing.bestPosition = pp.result_position;
        existing.awardsList.push(`${pp.result_position} Place`);
      }
      if (hasGrade && pp.result_grade) {
        if (!existing.bestGrade || pp.result_grade < existing.bestGrade) {
          existing.bestGrade = pp.result_grade;
        }
        existing.awardsList.push(`Grade ${pp.result_grade}`);
      }
    }

    participantProgramsMap.set(pp.participant_id, existing);

    totalPointsFest += points;
    if (pp.verification_status === "verified" || pp.result_points !== null || hasGrade || hasPosition) {
      totalSubmissionsFest += 1;
    }
  }

  // Pre-process all participants
  const processedParticipants = rawParticipants.map((p) => {
    const progData = participantProgramsMap.get(p.id) || {
      totalPoints: 0,
      count: 0,
      awardedCount: 0,
      bestGrade: null,
      bestPosition: null,
      awardsList: [],
    };
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
      awardedCount: progData.awardedCount,
      bestGrade: progData.bestGrade,
      bestPosition: progData.bestPosition,
      awardsList: progData.awardsList,
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

    // Sort by:
    // 1. Points descending (highest score first)
    // 2. Awarded programs count descending
    // 3. Total participated programs descending
    // 4. Name alphabetically
    filtered.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.awardedCount !== a.awardedCount) return b.awardedCount - a.awardedCount;
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

  // =========================================================================
  // BUILD PUBLISHED PROGRAM-WISE RESULTS (ONLY PROGRAMS WITH AWARDED MARKS)
  // =========================================================================
  const posOrder: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3 };
  const gradeOrder: Record<string, number> = { A: 1, B: 2, C: 3 };

  const publishedPrograms: PublishedProgramResult[] = [];

  for (const prog of rawPrograms) {
    const winners: ProgramWinnerEntry[] = [];

    for (const pp of rawPP) {
      if (pp.program_id !== prog.id) continue;
      let points = typeof pp.result_points === "number" ? pp.result_points : 0;
      const hasGrade = Boolean(pp.result_grade && pp.result_grade !== "None");
      const hasPosition = Boolean(pp.result_position && pp.result_position !== "None");

      // Only include if mark/grade/position was actually awarded!
      if (!hasGrade && !hasPosition && points <= 0) continue;

      if (points === 0 && (hasGrade || hasPosition)) {
        const g = pp.result_grade;
        const p = pp.result_position;
        const gPts = g === "A" ? 5 : g === "B" ? 3 : g === "C" ? 1 : 0;
        const pPts = p === "1st" ? 5 : p === "2nd" ? 3 : p === "3rd" ? 1 : 0;
        points = gPts + pPts;
      }

      const p = participantLookup.get(pp.participant_id);
      if (!p) continue;

      winners.push({
        participantId: p.id,
        registrationId: p.registration_id,
        name: p.name,
        district: p.district,
        gender: p.gender as "male" | "female",
        category: p.category as "junior" | "senior" | "super_senior",
        grade: hasGrade ? pp.result_grade : null,
        position: hasPosition ? pp.result_position : null,
        points,
        rank: 0,
        isPodium: false,
      });
    }

    // Only include this programme if at least 1 result has been published/awarded!
    if (winners.length > 0) {
      // Sort winners: 1st -> 2nd -> 3rd -> Non-podium by Points desc, Grade asc (A->B->C), Name asc
      winners.sort((a, b) => {
        const posA = a.position ? posOrder[a.position] || 99 : 99;
        const posB = b.position ? posOrder[b.position] || 99 : 99;
        if (posA !== posB) return posA - posB;

        if (b.points !== a.points) return b.points - a.points;

        const grdA = a.grade ? gradeOrder[a.grade] || 99 : 99;
        const grdB = b.grade ? gradeOrder[b.grade] || 99 : 99;
        if (grdA !== grdB) return grdA - grdB;

        return a.name.localeCompare(b.name);
      });

      // Assign clear sequential ranks: 1, 2, 3 for podium, 4, 5, 6... for grade holders
      winners.forEach((w, idx) => {
        if (w.position === "1st") {
          w.rank = 1;
          w.isPodium = true;
        } else if (w.position === "2nd") {
          w.rank = 2;
          w.isPodium = true;
        } else if (w.position === "3rd") {
          w.rank = 3;
          w.isPodium = true;
        } else {
          w.rank = idx + 1;
          w.isPodium = false;
        }
      });

      publishedPrograms.push({
        id: prog.id,
        code: prog.code,
        name: prog.name,
        categoryEligibility: prog.category_eligibility,
        genderEligibility: prog.gender_eligibility,
        totalAwarded: winners.length,
        winners,
      });
    }
  }

  // Compile full real-time database calculated payload
  const overallDistricts = buildDistrictList("all", "all");
  const leadingDistrict = overallDistricts.length > 0 && overallDistricts[0].totalPoints > 0 ? overallDistricts[0].district : overallDistricts[0]?.district || "—";
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
    publishedPrograms,
    stats: {
      totalPoints: totalPointsFest,
      totalActiveParticipants: rawParticipants.length,
      totalSubmissions: totalSubmissionsFest,
      totalPublishedPrograms: publishedPrograms.length,
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
            className="group flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-ink shadow-sm ring-1 ring-ink/10 backdrop-blur transition-all hover:bg-white hover:text-emerald cursor-pointer"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Home
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald">
              Live Database Results
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
            Live standings for Ahlu Saada Islamic Fest 2026 across Junior, Senior & Super Senior divisions with individual, district and program results.
          </p>
        </header>

        {/* Interactive Client Component */}
        <ResultsClient data={payload} />
      </div>
    </main>
  );
}
