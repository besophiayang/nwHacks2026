"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PASS_SCORE = 60; 

type ProblemRow = {
  id: string;
  title: string;
  link: string;
  category: string;
  difficulty: string;
  best_score?: number | null; 
};

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

const categoryStyles: Record<
  string,
  { stripe: string; title: string; pillBg: string; pillText: string }
> = {
  "solid mechanics": {
    stripe: "bg-pink-400",
    title: "text-pink-600",
    pillBg: "bg-pink-50",
    pillText: "text-pink-700",
  },
  "fluid dynamics": {
    stripe: "bg-green-300",
    title: "text-green-700",
    pillBg: "bg-green-50",
    pillText: "text-green-700",
  },
  materials: {
    stripe: "bg-purple-300",
    title: "text-purple-700",
    pillBg: "bg-purple-50",
    pillText: "text-purple-700",
  },
  thermodynamics: {
    stripe: "bg-orange-300",
    title: "text-orange-700",
    pillBg: "bg-orange-50",
    pillText: "text-orange-700",
  },
  manufacturing: {
    stripe: "bg-blue-300",
    title: "text-blue-700",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
  },
  calculations: {
    stripe: "bg-neutral-400",
    title: "text-neutral-700",
    pillBg: "bg-neutral-100",
    pillText: "text-neutral-700",
  },
};

function difficultyPill(difficultyRaw: string) {
  const d = norm(difficultyRaw);
  if (d === "easy")
    return { text: "Easy", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  if (d === "medium")
    return { text: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-100" };
  return { text: "Hard", cls: "bg-rose-50 text-rose-700 border-rose-100" };
}

export default function ProblemList() {
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setProblems(d.problems ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    return (problems ?? []).map((p) => {
      const score = Math.max(0, Math.min(100, Math.round(Number(p.best_score ?? 0))));
      const solved = score >= PASS_SCORE;
      return { ...p, score, solved };
    });
  }, [problems]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid grid-cols-12 text-xs font-semibold text-neutral-400">
        <div className="col-span-7">Problem</div>
        <div className="col-span-2">Difficulty</div>
        <div className="col-span-3">Progress</div>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((p) => {
          const catKey = norm(p.category);
          const cat =
            categoryStyles[catKey] ??
            ({
              stripe: "bg-neutral-300",
              title: "text-neutral-800",
              pillBg: "bg-neutral-100",
              pillText: "text-neutral-600",
            } as const);

          const diff = difficultyPill(p.difficulty);
          const slug = (p.link ?? "").replace(/^\/+/, "").replace(/^problems\//, "");
          const href = slug ? `/problems/${slug}` : "#";

          return (
            <Link key={p.id} href={href} className="block">
              <div
                className={[
                  "grid grid-cols-12 items-center rounded-2xl border border-neutral-100 bg-white p-4",
                  "transition hover:-translate-y-[1px] hover:shadow-md hover:border-neutral-200",
                  "active:translate-y-0 active:shadow-sm",
                ].join(" ")}
              >
                <div className="col-span-7 flex gap-4">
                  <div className={`w-2 rounded-full ${cat.stripe}`} />

                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-semibold ${cat.title}`}>{p.title}</div>

                      {p.solved && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                          Solved
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold lowercase ${cat.pillBg} ${cat.pillText}`}
                      >
                        {catKey || "uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${diff.cls}`}
                  >
                    {diff.text}
                  </span>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-neutral-200">
                      <div
                        className="h-2 rounded-full bg-neutral-500"
                        style={{ width: `${p.score}%` }}
                      />
                    </div>

                    <div className="w-10 text-right text-xs text-neutral-400">
                      {p.score}%
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}