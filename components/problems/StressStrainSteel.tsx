"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SpeechFeedback from "@/components/stt/SpeechFeedback";

type Pt = { x: number; y: number };

const CANVAS_W = 860;
const CANVAS_H = 460;

const M = { l: 80, r: 220, t: 40, b: 70 };
const PW = CANVAS_W - M.l - M.r;
const PH = CANVAS_H - M.t - M.b;

const RESAMPLE_N = 160;
const PASS_SCORE = 60;

const REF: Pt[] = [
  { x: 0.0, y: 0.0 },
  { x: 0.18, y: 0.55 },
  { x: 0.27, y: 0.5 },
  { x: 0.55, y: 0.78 },
  { x: 0.92, y: 0.6 },
];

const MAX_ALLOWED_MEAN_DIST = 0.35;
const MAX_ALLOWED_HAUSDORFF = 0.22;

// ✅ same pattern as aluminum
const DEMO_SRC = "/videos/stress-strain-demo.mp4";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function polylineLength(pts: Pt[]) {
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++) L += dist(pts[i], pts[i + 1]);
  return L;
}

function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));

  const L = polylineLength(pts);
  if (L < 1e-8) return Array.from({ length: n }, () => ({ ...pts[0] }));

  const step = L / (n - 1);
  const out: Pt[] = [{ ...pts[0] }];

  let acc = 0;
  let i = 0;

  while (out.length < n - 1 && i < pts.length - 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const seg = dist(a, b);

    if (acc + seg >= step) {
      const remain = step - acc;
      const t = seg <= 1e-8 ? 0 : remain / seg;
      const p = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
      out.push(p);

      pts[i] = p;
      acc = 0;
    } else {
      acc += seg;
      i++;
    }
  }

  out.push({ ...pts[pts.length - 1] });

  while (out.length < n) out.push({ ...out[out.length - 1] });
  return out.slice(0, n);
}

function canvasToNorm(p: Pt): Pt {
  const x = clamp((p.x - M.l) / PW, 0, 1);
  const y = clamp((M.t + PH - p.y) / PH, 0, 1);
  return { x, y };
}

function normToCanvas(p: Pt): Pt {
  return {
    x: M.l + p.x * PW,
    y: M.t + (1 - p.y) * PH,
  };
}

function compareCurves(user: Pt[], ref: Pt[]) {
  const nearestAvg = (A: Pt[], B: Pt[]) => {
    let sum = 0;
    let maxD = 0;
    for (const a of A) {
      let best = Infinity;
      for (const b of B) best = Math.min(best, dist(a, b));
      sum += best;
      maxD = Math.max(maxD, best);
    }
    return { mean: sum / A.length, max: maxD };
  };

  const a = nearestAvg(user, ref);
  const b = nearestAvg(ref, user);

  const mean = (a.mean + b.mean) / 2;
  const haus = Math.max(a.max, b.max);

  const meanScore = 100 * (1 - mean / MAX_ALLOWED_MEAN_DIST);
  const hausPenalty = haus > MAX_ALLOWED_HAUSDORFF ? 35 : 0;
  const score = clamp(meanScore - hausPenalty, 0, 100);

  return { mean, haus, score };
}

function inPlot(p: Pt) {
  return p.x >= M.l && p.x <= M.l + PW && p.y >= M.t && p.y <= M.t + PH;
}

function DemoOnceInline({
  show,
  src,
  onDone,
  muted = true,
}: {
  show: boolean;
  src: string;
  onDone: () => void;
  muted?: boolean;
}) {
  const vref = useRef<HTMLVideoElement | null>(null);
  const [needsClick, setNeedsClick] = useState(false);

  useEffect(() => {
    if (!show) return;
    const v = vref.current;
    if (!v) return;

    setNeedsClick(false);

    v.pause();
    v.currentTime = 0;
    v.loop = false;
    v.muted = muted;
    v.load();

    const t = window.setTimeout(async () => {
      try {
        const p = v.play();
        if (p) await p;
      } catch {
        setNeedsClick(true);
      }
    }, 50);

    return () => window.clearTimeout(t);
  }, [show, muted, src]);

  if (!show) return null;

  return (
    <div className="relative lg:justify-self-end lg:pr-2">
      <div className="relative">
        <video
          ref={vref}
          src={src}
          muted={muted}
          playsInline
          autoPlay
          loop={false}
          controls={false}
          preload="auto"
          onEnded={onDone}
          className="aspect-video w-full max-w-[420px] rounded-2xl object-cover"
          style={{ background: "transparent" }}
        />

        {needsClick && (
          <button
            type="button"
            onClick={async () => {
              const v = vref.current;
              if (!v) return;
              try {
                v.muted = muted;
                await v.play();
                setNeedsClick(false);
              } catch {}
            }}
            className="absolute inset-0 grid place-items-center rounded-2xl bg-white/30 backdrop-blur-sm"
            aria-label="Play demo"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black shadow">
              ▶
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function StressStrainSteel({ problemId }: { problemId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [drawing, setDrawing] = useState(false);

  const [result, setResult] = useState<null | {
    score: number;
    mean: number;
    haus: number;
    pass: boolean;
    msg: string;
  }>(null);

  const refCanvasPts = useMemo(() => REF.map(normToCanvas), []);

  // ✅ play demo every time user enters the question (mount)
  const [showDemo, setShowDemo] = useState(false);
  useEffect(() => {
    setShowDemo(true);
  }, []);
  function finishDemo() {
    setShowDemo(false);
  }

  function drawAll(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(M.l, M.t, PW, PH);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;

    const xTicks = 10;
    const yTicks = 8;
    for (let i = 0; i <= xTicks; i++) {
      const x = M.l + (PW * i) / xTicks;
      ctx.beginPath();
      ctx.moveTo(x, M.t);
      ctx.lineTo(x, M.t + PH);
      ctx.stroke();
    }
    for (let i = 0; i <= yTicks; i++) {
      const y = M.t + (PH * i) / yTicks;
      ctx.beginPath();
      ctx.moveTo(M.l, y);
      ctx.lineTo(M.l + PW, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(M.l, M.t + PH);
    ctx.lineTo(M.l + PW, M.t + PH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(M.l, M.t);
    ctx.lineTo(M.l, M.t + PH);
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Stress, σ", M.l - 55, M.t + 14);
    ctx.fillText("Strain, ε", M.l + PW - 55, M.t + PH + 44);

    if (result) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(refCanvasPts[0].x, refCanvasPts[0].y);
      for (let i = 1; i < refCanvasPts.length; i++) ctx.lineTo(refCanvasPts[i].x, refCanvasPts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (const s of strokes) {
      if (s.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAll(ctx);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redraw();
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, result]);

  function getCanvasPt(e: React.PointerEvent<HTMLCanvasElement>): Pt {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = getCanvasPt(e);
    if (!inPlot(p)) return;

    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    setDrawing(true);
    setResult(null);
    setStrokes((prev) => [...prev, [p]]);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const p = getCanvasPt(e);
    if (!inPlot(p)) return;

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const s = next[next.length - 1];
      if (s.length === 0 || dist(s[s.length - 1], p) > 1.5) s.push(p);
      next[next.length - 1] = s;
      return next;
    });
  }

  function onPointerUp() {
    setDrawing(false);
  }

  function reset() {
    setStrokes([]);
    setResult(null);
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1));
    setResult(null);
  }

  async function checkAnswer() {
    if (strokes.length === 0) {
      setResult({ score: 0, mean: 1, haus: 1, pass: false, msg: "Draw your curve first." });
      return;
    }

    const longest = strokes.reduce((best, s) => (s.length > best.length ? s : best), strokes[0]);

    if (longest.length < 10) {
      setResult({
        score: 0,
        mean: 1,
        haus: 1,
        pass: false,
        msg: "Your curve is too short. Draw a longer continuous curve.",
      });
      return;
    }

    const userNormRaw = longest.map(canvasToNorm).sort((a, b) => a.x - b.x);
    userNormRaw[0] = { x: 0, y: 0 };

    const user = resample([...userNormRaw], RESAMPLE_N);
    const ref = resample([...REF], RESAMPLE_N);

    const { mean, haus, score } = compareCurves(user, ref);
    const pass = score >= PASS_SCORE;

    const msg = pass
      ? `Nice! Your curve is pretty close. Score: ${score.toFixed(0)}/100`
      : `Not quite. Score: ${score.toFixed(0)}/100. Hint: Steel has a clear yield point.`;

    setResult({ score, mean, haus, pass, msg });

    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, score }),
    });

    await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId,
        status: pass ? "solved" : "attempted",
      }),
    });

    try {
      window.dispatchEvent(new Event("dashboard:refresh"));
    } catch {}
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-lg font-semibold text-neutral-900">
            Draw the stress–strain curve for steel.
          </div>
          <div className="mt-1 text-sm text-neutral-600">Your line should be continuous.</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Undo
          </button>
          <button
            onClick={reset}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Reset
          </button>
          <button
            onClick={checkAnswer}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Check Answer
          </button>
        </div>
      </div>

      {result && (
        <div
          className={[
            "mt-4 rounded-xl px-4 py-3 text-sm",
            result.pass ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          <div className="font-semibold">{result.msg}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <canvas
            ref={canvasRef}
            className="h-[360px] w-full rounded-xl bg-white"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        <DemoOnceInline show={showDemo} src={DEMO_SRC} onDone={finishDemo} muted={false} />
      </div>

      <SpeechFeedback problemText="Draw the stress–strain curve for steel." />
    </div>
  );
}

