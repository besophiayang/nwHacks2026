"use client";

import React, { useMemo, useState } from "react";

function Donut({ value, label }: { value: number; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
        <circle cx="36" cy="36" r={r} strokeWidth="8" fill="none" className="stroke-neutral-200" />
        <circle
          cx="36"
          cy="36"
          r={r}
          strokeWidth="8"
          fill="none"
          className="stroke-neutral-900"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" className="fill-neutral-900" style={{ fontSize: 14, fontWeight: 700 }}>
          {pct.toFixed(0)}%
        </text>
      </svg>

      <div>
        <div className="text-sm font-semibold text-neutral-900">{label}</div>
        <div className="text-xs text-neutral-500">out of 100</div>
      </div>
    </div>
  );
}

type Analysis = {
  clarity: number;
  correctness: number;
  filler: {
    total: number;
    counts: Record<string, number>;
    highlights: string[];
  };
  notes: string[];
};

export default function TranscriptAnalyzer({
  transcript,
  problemText,
}: {
  transcript: string;
  problemText?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const hasTranscript = transcript.trim().length > 0;

  const fillerPairs = useMemo(() => {
    const counts = analysis?.filler?.counts ?? {};
    return Object.entries(counts)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .filter(([, v]) => (v ?? 0) > 0);
  }, [analysis]);

  async function run() {
    if (!hasTranscript) return;
    setLoading(true);
    setErr(null);

    try {
      const r = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, problemText }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);

      setAnalysis(data as Analysis);
    } catch (e: any) {
      setErr(e?.message ?? "Analysis failed");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-neutral-900">
            Transcript Analysis
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Clarity + correctness scores, plus filler-word habits.
          </div>
        </div>

        <button
          onClick={run}
          disabled={!hasTranscript || loading}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold",
            !hasTranscript || loading
              ? "bg-neutral-100 text-neutral-400"
              : "bg-neutral-900 text-white hover:opacity-90",
          ].join(" ")}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {!hasTranscript && (
        <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          Record an explanation first, then click Analyze.
        </div>
      )}

      {err && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {analysis && (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <div className="flex flex-col gap-4">
              <Donut value={analysis.clarity} label="Clarity" />
              <Donut value={analysis.correctness} label="Correctness" />
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-neutral-900">
              Filler words
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Total: <span className="font-semibold">{analysis.filler?.total ?? 0}</span>
            </div>

            {fillerPairs.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {fillerPairs.map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
                  >
                    {k.replace("_", " ")}: {v}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-neutral-500">
                No common filler words detected.
              </div>
            )}

            {analysis.filler?.highlights?.length ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-neutral-500">
                  Examples
                </div>
                {analysis.filler.highlights.slice(0, 6).map((h, i) => (
                  <div key={i} className="rounded-xl bg-white px-3 py-2 text-sm text-neutral-700">
                    {h}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {analysis.notes?.length ? (
            <div className="md:col-span-2 rounded-2xl bg-neutral-50 p-4">
              <div className="text-sm font-semibold text-neutral-900">
                Suggestions
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {analysis.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
