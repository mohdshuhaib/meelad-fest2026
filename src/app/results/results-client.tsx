"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Users,
  MapPin,
  Flame,
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Layers,
  BookOpen,
} from "lucide-react";

export interface IndividualLeaderEntry {
  id: string;
  registrationId: string;
  name: string;
  district: string;
  category: "junior" | "senior" | "super_senior";
  gender: "male" | "female";
  totalPoints: number;
  participatedCount: number;
  totalAvailablePrograms: number;
  rank: number;
}

export interface DistrictLeaderEntry {
  district: string;
  totalPoints: number;
  participantsCount: number;
  programmesCount: number;
  rank: number;
}

export interface ResultsDataPayload {
  districtOverall: {
    all: DistrictLeaderEntry[];
    male: DistrictLeaderEntry[];
    female: DistrictLeaderEntry[];
  };
  districtCategory: {
    junior: { all: DistrictLeaderEntry[]; male: DistrictLeaderEntry[]; female: DistrictLeaderEntry[] };
    senior: { all: DistrictLeaderEntry[]; male: DistrictLeaderEntry[]; female: DistrictLeaderEntry[] };
    super_senior: { all: DistrictLeaderEntry[]; male: DistrictLeaderEntry[]; female: DistrictLeaderEntry[] };
  };
  individualCategory: {
    junior: { all: IndividualLeaderEntry[]; male: IndividualLeaderEntry[]; female: IndividualLeaderEntry[] };
    senior: { all: IndividualLeaderEntry[]; male: IndividualLeaderEntry[]; female: IndividualLeaderEntry[] };
    super_senior: { all: IndividualLeaderEntry[]; male: IndividualLeaderEntry[]; female: IndividualLeaderEntry[] };
  };
  stats: {
    totalPoints: number;
    totalActiveParticipants: number;
    totalSubmissions: number;
    leadingDistrict: string;
    leadingDistrictPoints: number;
  };
}

export function ResultsClient({ data }: { data: ResultsDataPayload }) {
  // District Leaderboard State
  const [districtCategory, setDistrictCategory] = useState<"overall" | "junior" | "senior" | "super_senior">("overall");
  const [districtGender, setDistrictGender] = useState<"all" | "male" | "female">("all");
  const [districtShowAll, setDistrictShowAll] = useState(false);

  // Individual Leaderboard State (Default is Junior)
  const [individualCategory, setIndividualCategory] = useState<"junior" | "senior" | "super_senior">("junior");
  const [individualGender, setIndividualGender] = useState<"all" | "male" | "female">("all");
  const [individualShowAll, setIndividualShowAll] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Compute Active District Entries
  const activeDistrictEntries: DistrictLeaderEntry[] = useMemo(() => {
    let list: DistrictLeaderEntry[] = [];
    if (districtCategory === "overall") {
      list = data.districtOverall[districtGender] || [];
    } else {
      list = data.districtCategory[districtCategory]?.[districtGender] || [];
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((d) => d.district.toLowerCase().includes(q));
  }, [data, districtCategory, districtGender, searchQuery]);

  // Compute Active Individual Entries
  const activeIndividualEntries: IndividualLeaderEntry[] = useMemo(() => {
    const list = data.individualCategory[individualCategory]?.[individualGender] || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.registrationId.toLowerCase().includes(q)
    );
  }, [data, individualCategory, individualGender, searchQuery]);

  const displayedDistricts = districtShowAll ? activeDistrictEntries : activeDistrictEntries.slice(0, 10);
  const displayedIndividuals = individualShowAll ? activeIndividualEntries : activeIndividualEntries.slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Top Highlights Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#063d35] to-[#0b5549] p-4 text-white shadow-lg shadow-emerald/10 ring-1 ring-white/10 sm:p-5">
          <div className="absolute -right-4 -top-4 size-20 rounded-full bg-gold/15 blur-xl group-hover:bg-gold/25 transition-all" />
          <div className="flex items-center gap-2 text-gold">
            <Trophy size={18} className="animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Leading District</span>
          </div>
          <p className="mt-2 font-serif text-lg font-bold sm:text-2xl truncate">
            {data.stats.leadingDistrict || "—"}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-100/70">
            {data.stats.leadingDistrictPoints} pts overall
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 text-ink shadow-sm ring-1 ring-ink/5 sm:p-5">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Points</span>
          </div>
          <p className="mt-2 font-serif text-xl font-bold text-emerald sm:text-2xl">
            {data.stats.totalPoints.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">Points awarded</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 text-ink shadow-sm ring-1 ring-ink/5 sm:p-5">
          <div className="flex items-center gap-2 text-emerald">
            <Users size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Contestants</span>
          </div>
          <p className="mt-2 font-serif text-xl font-bold sm:text-2xl">
            {data.stats.totalActiveParticipants.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">Active participants</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 text-ink shadow-sm ring-1 ring-ink/5 sm:p-5">
          <div className="flex items-center gap-2 text-gold">
            <TrendingUp size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Submissions</span>
          </div>
          <p className="mt-2 font-serif text-xl font-bold sm:text-2xl">
            {data.stats.totalSubmissions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">Program entries</p>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Quick search by District Name, Participant Name or Registration ID..."
          className="h-13 w-full rounded-2xl border border-ink/15 bg-white pl-12 pr-4 text-sm font-semibold text-ink shadow-sm outline-none transition-all placeholder:text-muted/70 focus:border-emerald focus:ring-4 focus:ring-emerald/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-ink/10 px-2.5 py-1 text-xs font-bold text-muted hover:bg-ink/20"
          >
            Clear
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DISTRICT LEADERBOARD                                           */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-gold/20 text-gold">
                <Crown size={17} />
              </span>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">
                District Championship
              </p>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
              District Leaderboard
            </h2>
            <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
              {districtCategory === "overall"
                ? "Combined total points across Junior, Senior & Super Senior categories."
                : `Standings for ${districtCategory.replace("_", " ")} category.`}
            </p>
          </div>

          {/* Category Tabs for District */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-cream/70 p-1.5 text-xs font-bold">
            {(
              [
                ["overall", "All Categories (Combined)"],
                ["junior", "Junior"],
                ["senior", "Senior"],
                ["super_senior", "Super Senior"],
              ] as const
            ).map(([cat, label]) => {
              const active = districtCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setDistrictCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 transition-all ${
                    active
                      ? "bg-emerald text-white shadow-md shadow-emerald/20"
                      : "text-muted hover:bg-white hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender Filter Pills for District */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Gender:</span>
            <div className="flex gap-1.5">
              {(
                [
                  ["all", "Common (All)"],
                  ["male", "Male Only"],
                  ["female", "Female Only"],
                ] as const
              ).map(([gender, label]) => {
                const active = districtGender === gender;
                return (
                  <button
                    key={gender}
                    onClick={() => setDistrictGender(gender)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? "bg-gold text-emerald shadow-sm"
                        : "bg-cream text-muted hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-xs font-bold text-muted">
            Showing {displayedDistricts.length} of {activeDistrictEntries.length} Districts
          </span>
        </div>

        {/* Top 3 Podium Highlights for District */}
        {activeDistrictEntries.length >= 3 && !searchQuery && (
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {/* 2nd Place */}
            <div className="order-2 flex flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80 p-5 shadow-sm sm:order-1">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 font-serif text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-300">
                      🥈
                    </div>
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      2nd Place
                    </span>
                  </div>
                  <Medal size={20} className="text-slate-400" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-slate-900">
                  {activeDistrictEntries[1]?.district}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>👥 {activeDistrictEntries[1]?.participantsCount} Participants</p>
                  <p>📑 {activeDistrictEntries[1]?.programmesCount} Entries</p>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3">
                <span className="text-2xl font-black text-slate-800">
                  {activeDistrictEntries[1]?.totalPoints}
                </span>
                <span className="ml-1.5 text-xs font-bold text-slate-500 uppercase">Points</span>
              </div>
            </div>

            {/* 1st Place Champion */}
            <div className="order-1 flex flex-col justify-between rounded-2xl border-2 border-gold bg-gradient-to-b from-amber-50 via-gold/10 to-amber-100/80 p-6 shadow-xl shadow-gold/15 ring-2 ring-gold/30 sm:order-2 sm:-translate-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 font-serif text-2xl font-bold text-amber-950 shadow-md ring-2 ring-amber-300">
                      🥇
                    </div>
                    <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald shadow-sm">
                      ★ 1st Place Leader
                    </span>
                  </div>
                  <Crown size={24} className="text-gold animate-bounce" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-extrabold text-ink sm:text-3xl">
                  {activeDistrictEntries[0]?.district}
                </h3>
                <div className="mt-2 space-y-1 text-xs font-semibold text-emerald">
                  <p>👥 {activeDistrictEntries[0]?.participantsCount} Registered Contestants</p>
                  <p>📑 {activeDistrictEntries[0]?.programmesCount} Program Participations</p>
                </div>
              </div>
              <div className="mt-5 border-t border-gold/30 pt-3">
                <span className="font-serif text-4xl font-black text-emerald">
                  {activeDistrictEntries[0]?.totalPoints}
                </span>
                <span className="ml-2 text-sm font-black uppercase tracking-wider text-gold">
                  Points
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-orange-100/60 p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-300 font-serif text-lg font-bold text-white shadow-sm ring-1 ring-amber-400">
                      🥉
                    </div>
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                      3rd Place
                    </span>
                  </div>
                  <Award size={20} className="text-amber-600" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-amber-950">
                  {activeDistrictEntries[2]?.district}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-amber-800">
                  <p>👥 {activeDistrictEntries[2]?.participantsCount} Participants</p>
                  <p>📑 {activeDistrictEntries[2]?.programmesCount} Entries</p>
                </div>
              </div>
              <div className="mt-4 border-t border-amber-200 pt-3">
                <span className="text-2xl font-black text-amber-900">
                  {activeDistrictEntries[2]?.totalPoints}
                </span>
                <span className="ml-1.5 text-xs font-bold text-amber-700 uppercase">Points</span>
              </div>
            </div>
          </div>
        )}

        {/* District Table */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-ink/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10 bg-cream/50 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3.5 sm:px-6">Rank</th>
                  <th className="px-4 py-3.5 sm:px-6">District</th>
                  <th className="px-4 py-3.5 text-center sm:px-6">Participants Count</th>
                  <th className="px-4 py-3.5 text-center sm:px-6">Participated Programmes</th>
                  <th className="px-4 py-3.5 text-right sm:px-6">Total Mark / Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 text-sm font-semibold">
                {displayedDistricts.map((item) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;
                  const isTop3 = isGold || isSilver || isBronze;

                  return (
                    <tr
                      key={item.district}
                      className={`transition-colors hover:bg-cream/40 ${
                        isGold
                          ? "bg-amber-50/50 font-bold"
                          : isSilver
                          ? "bg-slate-50/50"
                          : isBronze
                          ? "bg-orange-50/30"
                          : ""
                      }`}
                    >
                      {/* Rank / Badge */}
                      <td className="px-4 py-4 sm:px-6">
                        <RankBadge rank={item.rank} />
                      </td>

                      {/* District Name */}
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className={isTop3 ? "text-gold" : "text-muted"} />
                          <span className={`font-serif text-base ${isTop3 ? "font-bold text-ink" : "text-ink/90"}`}>
                            {item.district}
                          </span>
                          {isGold && (
                            <span className="hidden rounded-full bg-gold/25 px-2 py-0.5 text-[9px] font-black uppercase text-emerald sm:inline-block">
                              Leader
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Participants Count */}
                      <td className="px-4 py-4 text-center sm:px-6">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-ink">
                          <Users size={12} className="text-muted" />
                          {item.participantsCount}
                        </span>
                      </td>

                      {/* Participated Programmes Count */}
                      <td className="px-4 py-4 text-center sm:px-6">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-ink">
                          <BookOpen size={12} className="text-muted" />
                          {item.programmesCount}
                        </span>
                      </td>

                      {/* Total Mark / Points */}
                      <td className="px-4 py-4 text-right sm:px-6">
                        <span
                          className={`font-serif text-lg font-black ${
                            isGold
                              ? "text-emerald"
                              : isSilver
                              ? "text-slate-800"
                              : isBronze
                              ? "text-amber-800"
                              : "text-ink"
                          }`}
                        >
                          {item.totalPoints}
                        </span>
                        <span className="ml-1 text-[10px] font-bold uppercase text-muted">pts</span>
                      </td>
                    </tr>
                  );
                })}

                {displayedDistricts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-medium text-muted">
                      No district results found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Toggle Show Top 10 / Show All */}
          {activeDistrictEntries.length > 10 && (
            <div className="border-t border-ink/10 bg-cream/30 p-3 text-center">
              <button
                onClick={() => setDistrictShowAll(!districtShowAll)}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-emerald hover:bg-emerald/10 transition-colors"
              >
                {districtShowAll
                  ? "Show Top 10 Only"
                  : `View All ${activeDistrictEntries.length} Districts`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INDIVIDUAL LEADERBOARD                                         */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Trophy size={17} />
              </span>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald">
                Individual Stars
              </p>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
              Individual Leaderboard
            </h2>
            <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
              Top performing individual participants categorized by age division.
            </p>
          </div>

          {/* Category Tabs for Individual (Default: Junior) */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-cream/70 p-1.5 text-xs font-bold">
            {(
              [
                ["junior", "Junior (Default)"],
                ["senior", "Senior"],
                ["super_senior", "Super Senior"],
              ] as const
            ).map(([cat, label]) => {
              const active = individualCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setIndividualCategory(cat)}
                  className={`rounded-xl px-4 py-2 transition-all ${
                    active
                      ? "bg-emerald text-white shadow-md shadow-emerald/20"
                      : "text-muted hover:bg-white hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender Filter Pills for Individual */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Gender:</span>
            <div className="flex gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["male", "Male Only"],
                  ["female", "Female Only"],
                ] as const
              ).map(([gender, label]) => {
                const active = individualGender === gender;
                return (
                  <button
                    key={gender}
                    onClick={() => setIndividualGender(gender)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? "bg-emerald text-white shadow-sm"
                        : "bg-cream text-muted hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-xs font-bold text-muted">
            Showing {displayedIndividuals.length} of {activeIndividualEntries.length} Performers
          </span>
        </div>

        {/* Top 3 Podium Highlights for Individual (if at least 3 participants) */}
        {activeIndividualEntries.length >= 3 && !searchQuery && (
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {/* 2nd Place */}
            <div className="order-2 flex flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80 p-5 shadow-sm sm:order-1">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 font-serif text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-300">
                      🥈
                    </div>
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      2nd Place
                    </span>
                  </div>
                  <Medal size={20} className="text-slate-400" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-slate-900">
                  {activeIndividualEntries[1]?.name}
                </h3>
                <p className="text-xs font-bold text-emerald">
                  {activeIndividualEntries[1]?.registrationId}
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>📍 {activeIndividualEntries[1]?.district}</p>
                  <p>📑 {activeIndividualEntries[1]?.participatedCount} / {activeIndividualEntries[1]?.totalAvailablePrograms} Programs</p>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3">
                <span className="text-2xl font-black text-slate-800">
                  {activeIndividualEntries[1]?.totalPoints}
                </span>
                <span className="ml-1.5 text-xs font-bold text-slate-500 uppercase">Points</span>
              </div>
            </div>

            {/* 1st Place Champion */}
            <div className="order-1 flex flex-col justify-between rounded-2xl border-2 border-gold bg-gradient-to-b from-amber-50 via-gold/10 to-amber-100/80 p-6 shadow-xl shadow-gold/15 ring-2 ring-gold/30 sm:order-2 sm:-translate-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 font-serif text-2xl font-bold text-amber-950 shadow-md ring-2 ring-amber-300">
                      🥇
                    </div>
                    <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald shadow-sm">
                      ★ Top Performer
                    </span>
                  </div>
                  <Crown size={24} className="text-gold animate-bounce" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-extrabold text-ink sm:text-3xl">
                  {activeIndividualEntries[0]?.name}
                </h3>
                <p className="text-xs font-bold text-emerald">
                  {activeIndividualEntries[0]?.registrationId}
                </p>
                <div className="mt-2 space-y-1 text-xs font-semibold text-emerald">
                  <p>📍 {activeIndividualEntries[0]?.district}</p>
                  <p>📑 {activeIndividualEntries[0]?.participatedCount} / {activeIndividualEntries[0]?.totalAvailablePrograms} Programs Participated</p>
                </div>
              </div>
              <div className="mt-5 border-t border-gold/30 pt-3">
                <span className="font-serif text-4xl font-black text-emerald">
                  {activeIndividualEntries[0]?.totalPoints}
                </span>
                <span className="ml-2 text-sm font-black uppercase tracking-wider text-gold">
                  Points
                </span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-orange-100/60 p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-300 font-serif text-lg font-bold text-white shadow-sm ring-1 ring-amber-400">
                      🥉
                    </div>
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                      3rd Place
                    </span>
                  </div>
                  <Award size={20} className="text-amber-600" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-amber-950">
                  {activeIndividualEntries[2]?.name}
                </h3>
                <p className="text-xs font-bold text-emerald">
                  {activeIndividualEntries[2]?.registrationId}
                </p>
                <div className="mt-2 space-y-1 text-xs text-amber-800">
                  <p>📍 {activeIndividualEntries[2]?.district}</p>
                  <p>📑 {activeIndividualEntries[2]?.participatedCount} / {activeIndividualEntries[2]?.totalAvailablePrograms} Programs</p>
                </div>
              </div>
              <div className="mt-4 border-t border-amber-200 pt-3">
                <span className="text-2xl font-black text-amber-900">
                  {activeIndividualEntries[2]?.totalPoints}
                </span>
                <span className="ml-1.5 text-xs font-bold text-amber-700 uppercase">Points</span>
              </div>
            </div>
          </div>
        )}

        {/* Individual Table */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-ink/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10 bg-cream/50 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3.5 sm:px-6">Rank</th>
                  <th className="px-4 py-3.5 sm:px-6">Participant</th>
                  <th className="px-4 py-3.5 sm:px-6">District</th>
                  <th className="px-4 py-3.5 text-center sm:px-6">Programmes Participated</th>
                  <th className="px-4 py-3.5 text-right sm:px-6">Total Mark / Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 text-sm font-semibold">
                {displayedIndividuals.map((item) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;
                  const isTop3 = isGold || isSilver || isBronze;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-cream/40 ${
                        isGold
                          ? "bg-amber-50/50 font-bold"
                          : isSilver
                          ? "bg-slate-50/50"
                          : isBronze
                          ? "bg-orange-50/30"
                          : ""
                      }`}
                    >
                      {/* Rank / Badge */}
                      <td className="px-4 py-4 sm:px-6">
                        <RankBadge rank={item.rank} />
                      </td>

                      {/* Participant Name & Reg ID */}
                      <td className="px-4 py-4 sm:px-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-bold text-ink">
                              {item.name}
                            </span>
                            <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald">
                              {item.registrationId}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-muted">
                            {item.gender === "male" ? "♂ Male" : "♀ Female"} • {item.category.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      {/* District */}
                      <td className="px-4 py-4 sm:px-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/80">
                          <MapPin size={14} className="text-gold" />
                          {item.district}
                        </span>
                      </td>

                      {/* Programmes Count Participated */}
                      <td className="px-4 py-4 text-center sm:px-6">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-cream px-3 py-1 text-xs font-bold text-ink">
                          <BookOpen size={13} className="text-muted" />
                          {item.participatedCount}
                          <span className="text-muted">/ {item.totalAvailablePrograms}</span>
                        </span>
                      </td>

                      {/* Total Mark / Points */}
                      <td className="px-4 py-4 text-right sm:px-6">
                        <span
                          className={`font-serif text-lg font-black ${
                            isGold
                              ? "text-emerald"
                              : isSilver
                              ? "text-slate-800"
                              : isBronze
                              ? "text-amber-800"
                              : "text-ink"
                          }`}
                        >
                          {item.totalPoints}
                        </span>
                        <span className="ml-1 text-[10px] font-bold uppercase text-muted">pts</span>
                      </td>
                    </tr>
                  );
                })}

                {displayedIndividuals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-medium text-muted">
                      No individual scores found for the selected category and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Toggle Show Top 10 / Show All */}
          {activeIndividualEntries.length > 10 && (
            <div className="border-t border-ink/10 bg-cream/30 p-3 text-center">
              <button
                onClick={() => setIndividualShowAll(!individualShowAll)}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-emerald hover:bg-emerald/10 transition-colors"
              >
                {individualShowAll
                  ? "Show Top 10 Only"
                  : `View All ${activeIndividualEntries.length} Ranked Participants`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer Navigation */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-cream/50 p-6 sm:flex-row">
        <div>
          <p className="font-serif text-lg font-bold text-ink">Ahlu Saada Islamic Fest 2026</p>
          <p className="text-xs text-muted">Official Leaderboards & Standings</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-emerald px-5 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft size={16} /> Back to Homepage
        </Link>
      </div>
    </div>
  );
}

// Stylish Rank Badge Component
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 font-serif text-base font-black text-amber-950 shadow-md ring-2 ring-amber-300/80">
        🥇
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-300 via-slate-200 to-slate-100 font-serif text-base font-black text-slate-800 shadow-md ring-2 ring-slate-300">
        🥈
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 font-serif text-base font-black text-white shadow-md ring-2 ring-amber-500/80">
        🥉
      </div>
    );
  }
  return (
    <div className="inline-flex size-8 items-center justify-center rounded-lg bg-cream font-serif text-xs font-black text-ink/70 ring-1 ring-ink/10">
      #{rank}
    </div>
  );
}
