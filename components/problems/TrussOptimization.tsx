"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };
type JointKey = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

export default function TrussOptimization() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [layoutTick, setLayoutTick] = useState(0);

  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const [beam, setBeam] = useState<{ x1: number; y1: number; x2: number; y2: number }>({
    x1: 420,
    y1: 300,
    x2: 600,
    y2: 300,
  });

  const [snap, setSnap] = useState<{ end1: JointKey | null; end2: JointKey | null }>({
    end1: null,
    end2: null,
  });

  const dragRef = useRef<{
    dragging: boolean;
    mode: "move" | "pivot" | "freeMove";
    anchorEnd: 1 | 2 | null;
    startSnap: { end1: JointKey | null; end2: JointKey | null };
    startSvg: { x: number; y: number };
    startBeam: { x1: number; y1: number; x2: number; y2: number };
  }>({
    dragging: false,
    mode: "move",
    anchorEnd: null,
    startSnap: { end1: null, end2: null },
    startSvg: { x: 0, y: 0 },
    startBeam: { x1: 0, y1: 0, x2: 0, y2: 0 },
  });

  useEffect(() => {
    const bump = () => setLayoutTick((t) => t + 1);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => bump());
      if (stageRef.current) ro.observe(stageRef.current);
      if (svgRef.current) ro.observe(svgRef.current);
    }

    window.addEventListener("resize", bump);
    return () => {
      window.removeEventListener("resize", bump);
      ro?.disconnect();
    };
  }, []);

  const joints = useMemo(() => {
    const A: Pt = { x: 270, y: 120 };
    const B: Pt = { x: 390, y: 120 };
    const C: Pt = { x: 510, y: 120 };
    const D: Pt = { x: 630, y: 120 };
    const E: Pt = { x: 750, y: 120 };

    const F: Pt = { x: 270, y: 240 };
    const G: Pt = { x: 390, y: 200 };
    const H: Pt = { x: 630, y: 200 };
    const I: Pt = { x: 720, y: 260 };

    const LTOP: Pt = { x: 140, y: 120 };
    const LBOT: Pt = { x: 140, y: 330 };
    const RTOP: Pt = { x: 860, y: 120 };
    const RBOT: Pt = { x: 860, y: 330 };

    return { A, B, C, D, E, F, G, H, I, LTOP, LBOT, RTOP, RBOT };
  }, []);

  const members = useMemo(() => {
    const p = joints;
    const m = (a: keyof typeof joints, b: keyof typeof joints) => [p[a], p[b]] as const;

    return {
      top: [m("A", "B"), m("B", "C"), m("C", "D"), m("D", "E"), m("LTOP", "A"), m("E", "RTOP")],
      bottom: [m("LBOT", "F"), m("F", "G"), m("G", "C"), m("C", "H"), m("H", "I"), m("I", "RBOT")],
      web: [m("A", "F"), m("B", "G"), m("D", "H"), m("E", "I"), m("F", "B"), m("G", "C"), m("D", "I")],
      endFrames: [
        m("LBOT", "A"),
        m("LBOT", "F"),
        m("LTOP", "LBOT"),
        m("RBOT", "E"),
        m("RBOT", "RTOP"),
        m("RTOP", "E"),
        m("RBOT", "I"),
      ],
    };
  }, [joints]);

  const jointList: Array<{ key: JointKey; label: string }> = useMemo(
    () => [
      { key: "A", label: "A" },
      { key: "B", label: "B" },
      { key: "C", label: "C" },
      { key: "D", label: "D" },
      { key: "E", label: "E" },
      { key: "F", label: "F" },
      { key: "G", label: "G" },
      { key: "H", label: "H" },
      { key: "I", label: "I" },
    ],
    []
  );

  function svgPointToStagePx(pt: Pt) {
    const svg = svgRef.current;
    const stage = stageRef.current;
    if (!svg || !stage) return null;

    const svgRect = svg.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    const xInSvgPx = (pt.x / 1000) * svgRect.width;
    const yInSvgPx = (pt.y / 450) * svgRect.height;

    return {
      x: svgRect.left - stageRect.left + xInSvgPx,
      y: svgRect.top - stageRect.top + yInSvgPx,
    };
  }

  function stagePxToSvgPoint(stageX: number, stageY: number): Pt | null {
    const svg = svgRef.current;
    const stage = stageRef.current;
    if (!svg || !stage) return null;

    const svgRect = svg.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    const xInSvgPx = stageX - (svgRect.left - stageRect.left);
    const yInSvgPx = stageY - (svgRect.top - stageRect.top);

    const x = (xInSvgPx / svgRect.width) * 1000;
    const y = (yInSvgPx / svgRect.height) * 450;

    return { x, y };
  }

  function snapRadiusSvg(pxRadius: number) {
    const svg = svgRef.current;
    if (!svg) return 18;
    const r = svg.getBoundingClientRect();
    const sx = 1000 / Math.max(1, r.width);
    const sy = 450 / Math.max(1, r.height);
    return pxRadius * Math.max(sx, sy);
  }

  function nearestJointSvg(pt: Pt, radiusSvg: number, disallow?: JointKey | null) {
    let best: JointKey | null = null;
    let bestD = Infinity;

    for (const { key } of jointList) {
      if (disallow && key === disallow) continue;
      const p = joints[key];
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }

    if (best && bestD <= radiusSvg) return { key: best, x: joints[best].x, y: joints[best].y };
    return { key: null as JointKey | null, x: pt.x, y: pt.y };
  }

  function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return Math.hypot(px - ax, py - ay);
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    return Math.hypot(px - cx, py - cy);
  }

  function beamEndSvg(which: 1 | 2): Pt {
    const k = which === 1 ? snap.end1 : snap.end2;
    if (k) return joints[k];
    return which === 1 ? { x: beam.x1, y: beam.y1 } : { x: beam.x2, y: beam.y2 };
  }

  function getBeamThicknessPx() {
    const svg = svgRef.current;
    if (!svg) return 10;
    const r = svg.getBoundingClientRect();
    const scale = r.width / 1000;
    return Math.max(6, Math.min(14, 12 * scale));
  }

  function onBeamPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;

    const end1Svg = beamEndSvg(1);
    const end2Svg = beamEndSvg(2);

    const p1 = svgPointToStagePx(end1Svg);
    const p2 = svgPointToStagePx(end2Svg);
    if (!p1 || !p2) return;

    const d1 = Math.hypot(px - p1.x, py - p1.y);
    const d2 = Math.hypot(px - p2.x, py - p2.y);
    const dSeg = distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);

    const thick = getBeamThicknessPx();
    const END_HIT = Math.max(14, thick * 2.0);
    const SEG_HIT = Math.max(12, thick * 1.6);

    const end1Snapped = snap.end1 !== null;
    const end2Snapped = snap.end2 !== null;

    let mode: "move" | "pivot" | "freeMove" = "move";
    let anchorEnd: 1 | 2 | null = null;

    if (dSeg <= SEG_HIT && d1 > END_HIT && d2 > END_HIT) {
      mode = "freeMove";
      anchorEnd = null;
      setSnap({ end1: null, end2: null });
    } else if (d1 <= END_HIT) {
      if (end2Snapped && !end1Snapped) {
        mode = "pivot";
        anchorEnd = 2;
      } else if (end1Snapped && !end2Snapped) {
        mode = "pivot";
        anchorEnd = 1;
      } else {
        mode = "pivot";
        anchorEnd = 2;
      }
    } else if (d2 <= END_HIT) {
      if (end1Snapped && !end2Snapped) {
        mode = "pivot";
        anchorEnd = 1;
      } else if (end2Snapped && !end1Snapped) {
        mode = "pivot";
        anchorEnd = 2;
      } else {
        mode = "pivot";
        anchorEnd = 1;
      }
    } else if (end1Snapped && !end2Snapped) {
      mode = "pivot";
      anchorEnd = 1;
    } else if (end2Snapped && !end1Snapped) {
      mode = "pivot";
      anchorEnd = 2;
    } else if (dSeg <= SEG_HIT) {
      mode = "move";
      anchorEnd = null;
    } else {
      return;
    }

    const curSvg = stagePxToSvgPoint(px, py);
    if (!curSvg) return;

    dragRef.current.dragging = true;
    dragRef.current.mode = mode;
    dragRef.current.anchorEnd = anchorEnd;
    dragRef.current.startSnap = { ...snap };
    dragRef.current.startSvg = { x: curSvg.x, y: curSvg.y };
    dragRef.current.startBeam = { x1: end1Svg.x, y1: end1Svg.y, x2: end2Svg.x, y2: end2Svg.y };

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;

    const stage = stageRef.current;
    if (!stage) return;

    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;

    const curSvg = stagePxToSvgPoint(px, py);
    if (!curSvg) return;

    const sensitivity = 1.0;
    const dx = (curSvg.x - dragRef.current.startSvg.x) * sensitivity;
    const dy = (curSvg.y - dragRef.current.startSvg.y) * sensitivity;

    const { mode, anchorEnd, startSnap, startBeam } = dragRef.current;

    if (mode === "freeMove") {
      setBeam({
        x1: startBeam.x1 + dx,
        y1: startBeam.y1 + dy,
        x2: startBeam.x2 + dx,
        y2: startBeam.y2 + dy,
      });
      return;
    }

    const SNAP_R = snapRadiusSvg(18);

    if (mode === "move") {
      const next = {
        x1: startBeam.x1 + dx,
        y1: startBeam.y1 + dy,
        x2: startBeam.x2 + dx,
        y2: startBeam.y2 + dy,
      };

      const s1 = nearestJointSvg({ x: next.x1, y: next.y1 }, SNAP_R, null);
      const s2 = nearestJointSvg({ x: next.x2, y: next.y2 }, SNAP_R, s1.key);

      setBeam({ x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y });
      setSnap({ end1: s1.key, end2: s2.key });
      return;
    }

    const anchorIs1 = anchorEnd === 1;
    const anchorIs2 = anchorEnd === 2;

    const anchorKey = anchorIs1 ? startSnap.end1 : startSnap.end2;

    let ax = anchorIs1 ? startBeam.x1 : startBeam.x2;
    let ay = anchorIs1 ? startBeam.y1 : startBeam.y2;

    if (anchorKey) {
      ax = joints[anchorKey].x;
      ay = joints[anchorKey].y;
    }

    const free = nearestJointSvg({ x: curSvg.x, y: curSvg.y }, SNAP_R, anchorKey ?? null);

    if (anchorIs1) {
      setBeam({ x1: ax, y1: ay, x2: free.x, y2: free.y });
      setSnap({ end1: anchorKey, end2: free.key });
    } else if (anchorIs2) {
      setBeam({ x1: free.x, y1: free.y, x2: ax, y2: ay });
      setSnap({ end1: free.key, end2: anchorKey });
    }
  }

  function onStagePointerUp() {
    const wasFreeMove = dragRef.current.mode === "freeMove";
    dragRef.current.dragging = false;

    if (!wasFreeMove) return;

    const SNAP_R = snapRadiusSvg(18);

    const s1 = nearestJointSvg({ x: beam.x1, y: beam.y1 }, SNAP_R, null);
    const s2 = nearestJointSvg({ x: beam.x2, y: beam.y2 }, SNAP_R, s1.key);

    setBeam({ x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y });
    setSnap({ end1: s1.key, end2: s2.key });
  }

  function checkAnswer() {
    setChecked(true);
    const ok = (snap.end1 === "G" && snap.end2 === "H") || (snap.end1 === "H" && snap.end2 === "G");
    setScore(ok ? 100 : 0);
  }

  const end1SvgNow = beamEndSvg(1);
  const end2SvgNow = beamEndSvg(2);

  const p1 = svgPointToStagePx(end1SvgNow);
  const p2 = svgPointToStagePx(end2SvgNow);

  const vx = (p2?.x ?? 0) - (p1?.x ?? 0);
  const vy = (p2?.y ?? 0) - (p1?.y ?? 0);
  const lengthPx = Math.max(10, Math.hypot(vx, vy));
  const angleDeg = (Math.atan2(vy, vx) * 180) / Math.PI;

  const isCorrect = score === 100;

  const TRUSS = "#9A9A9A";
  const JOINT_STROKE = "#AFAFAF";
  const JOINT_FILL = "#F7F7F7";
  const LABEL = "#2F2F2F";

  const hintText =
    "Hint: Add the member where it turns the most flexible panel into a triangle—that’s usually where shear distortion is highest and compression members have the largest effective buckling length.";

  const beamThickPx = getBeamThicknessPx();

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xl font-semibold text-neutral-900">Truss Optimization</div>
            <div className="mt-1 text-sm text-neutral-500">Your member must connect two joints.</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setBeam({ x1: 420, y1: 300, x2: 600, y2: 300 });
                setSnap({ end1: null, end2: null });
                setChecked(false);
                setScore(null);
                setLayoutTick((t) => t + 1);
              }}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={checkAnswer}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
            >
              Check Answer
            </button>
          </div>
        </div>

        {checked && score !== null && (
          <div
            className={[
              "mt-5 rounded-xl border px-4 py-3 text-sm font-semibold",
              isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
            ].join(" ")}
          >
            {isCorrect ? `Correct. Score: ${score}/100.` : `Not quite. Score: ${score}/100. ${hintText}`}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm leading-6 text-neutral-700">
            A pin-jointed truss bridge is shown below. You may{" "}
            <span className="font-semibold">add one extra member</span> connecting any two existing joints to increase
            the load-carrying capacity by reducing the maximum axial force and buckling risk in the most critical
            members. Where would you place the new member, and why?
          </div>

          <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-4">
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-2xl bg-[#F3F3F3]"
              style={{ height: 380 }}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={onStagePointerUp}
              onPointerLeave={onStagePointerUp}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 1000 450"
                className="block h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect x="70" y="90" width="120" height="300" rx="6" fill="#D8D8D8" />
                <rect x="810" y="90" width="120" height="300" rx="6" fill="#D8D8D8" />
                <rect x="180" y="90" width="10" height="300" fill="#CFCFCF" />
                <rect x="810" y="90" width="10" height="300" fill="#CFCFCF" />

                {[...members.top, ...members.web, ...members.bottom, ...members.endFrames].map(([a, b], i) => (
                  <line
                    key={`m-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={TRUSS}
                    strokeWidth={12}
                    strokeLinecap="round"
                  />
                ))}

                {checked && (
                  <line
                    x1={joints.G.x}
                    y1={joints.G.y}
                    x2={joints.H.x}
                    y2={joints.H.y}
                    stroke="#4ADE80"
                    strokeWidth={12}
                    strokeLinecap="round"
                    opacity={0.55}
                  />
                )}

                {jointList.map(({ key, label }) => {
                  const pt = joints[key];
                  const below = key === "F" || key === "G" || key === "H" || key === "I";
                  const labelY = below ? pt.y + 28 : pt.y - 20;

                  return (
                    <g key={key}>
                      <circle cx={pt.x} cy={pt.y} r={10} fill={JOINT_FILL} stroke={JOINT_STROKE} strokeWidth={4} />
                      <text
                        x={pt.x}
                        y={labelY}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="700"
                        fill={LABEL}
                        style={{ userSelect: "none" }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {p1 && p2 && (
                <div
                  key={layoutTick}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute cursor-grab active:cursor-grabbing select-none"
                  style={{
                    left: p1.x,
                    top: p1.y - beamThickPx / 2,
                    width: lengthPx,
                    height: beamThickPx,
                    borderRadius: 999,
                    background: "#5F5F5F",
                    boxShadow: "0 2px 0 rgba(0,0,0,0.12)",
                    transformOrigin: "0 50%",
                    transform: `rotate(${angleDeg}deg)`,
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    caretColor: "transparent",
                    outline: "none",
                  }}
                  onPointerDown={onBeamPointerDown}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
