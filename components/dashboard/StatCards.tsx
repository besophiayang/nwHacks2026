"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardStats = {
  weeklySolved: number[]; 
  weeklyByCategory: Record<string, number[]>; 
  streak: number;
};

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

const accentByCategory: Record<string, string> = {
  "solid mechanics": "bg-pink-400",
  "fluid dynamics": "bg-green-300",
  materials: "bg-purple-300",
  thermodynamics: "bg-orange-300",
  manufacturing: "bg-blue-300",
  calculations: "bg-neutral-400",
};

export default function StatCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  async function loadStats() {
    const r = await fetch("/api/dashboard", { cache: "no-store" });
    const d = await r.json();
    console.log("dashboard stats:", d);


    setStats({
      weeklySolved: d.weeklySolved ?? [0, 0, 0, 0, 0, 0, 0],
      weeklyByCategory: d.weeklyByCategory ?? {},
      streak: d.streak ?? 0,
    });
  }

  useEffect(() => {
    loadStats();
    const onRefresh = () => loadStats();
    window.addEventListener("dashboard:refresh", onRefresh);
    return () => window.removeEventListener("dashboard:refresh", onRefresh);
  }, []);

  const weeklyMax = useMemo(() => Math.max(1, ...(stats?.weeklySolved ?? [1])), [stats]);
  const categories = useMemo(() => Object.keys(stats?.weeklyByCategory ?? {}), [stats]);

  const streak = stats?.streak ?? 0;
  const streakIcons = Array.from({ length: 7 }, (_, i) => i < Math.min(streak, 7));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Streak */}
      <div className="rounded-2xl bg-white p-5 shadow-sm md:col-span-1">
        <div className="text-sm font-semibold text-neutral-800">Streak</div>

        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-lg">
          {streakIcons.map((on, i) => (
            <span key={i} className={on ? "" : "opacity-30"}>
              {on ? "🔥" : "•"}
            </span>
          ))}
        </div>

        <div className="mt-3 text-xs text-neutral-400">
          {streak} day{streak === 1 ? "" : "s"}
        </div>
      </div>

      {/* Weekly Statistics */}
      <div className="rounded-2xl bg-white p-5 shadow-sm md:col-span-2">
        <div className="text-sm font-semibold text-neutral-800">Weekly Statistics</div>

        <div className="mt-4 grid grid-cols-7 items-end gap-4 sm:gap-5 md:gap-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, dayIdx) => {
            const total = stats?.weeklySolved?.[dayIdx] ?? 0;

            // consistent container, scale fill inside it
            const containerH = 72;
            const fillH = Math.round((total / weeklyMax) * containerH);

            return (
              <div key={d} className="flex w-full flex-col items-center gap-2">
                <div
                    className="w-full max-w-[56px] overflow-hidden rounded-2xl bg-neutral-100"
                    style={{ height: `${containerH}px` }}
                    >
                  <div className="flex h-full flex-col justify-end">
                    <div className="w-full" style={{ height: `${fillH}px` }}>
                      <div className="flex h-full flex-col justify-end">
                        {categories.map((cat) => {
                          const key = norm(cat);
                          const v = stats?.weeklyByCategory?.[cat]?.[dayIdx] ?? 0;
                          if (!v || total === 0) return null;

                          const segPct = (v / total) * 100;
                          return (
                            <div
                              key={cat}
                              className={accentByCategory[key] ?? "bg-neutral-400"}
                              style={{ height: `${segPct}%` }}
                              title={`${cat}: ${v}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-400">{d}</div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
  );
}
