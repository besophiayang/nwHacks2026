"use client";

import React, { useMemo, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import SpeechFeedback from "@/components/stt/SpeechFeedback";

import gear8 from "../../images/gear8.png";
import gear12 from "../../images/gear12.png";
import gear24 from "../../images/gear24.png";

type GearSize = 8 | 12 | 24;

type Gear = {
  id: string;
  teeth: GearSize;
  x: number; 
  y: number;
  size: number;
  pegId: string | null;
};

type PegDef = {
  id: string;
  cx: number;
  cy: number;
  r: number;
};

function gearSrc(teeth: GearSize): StaticImageData {
  if (teeth === 8) return gear8;
  if (teeth === 12) return gear12;
  return gear24;
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function centerOfGear(g: Gear) {
  return { cx: g.x + g.size / 2, cy: g.y + g.size / 2 };
}

function snapGearToPeg(g: Gear, peg: PegDef) {
  return {
    ...g,
    x: peg.cx - g.size / 2,
    y: peg.cy - g.size / 2,
    pegId: peg.id,
  };
}

function spinSecondsForTeeth(teeth: GearSize) {
  if (teeth === 24) return 3.8;
  if (teeth === 12) return 2.4;
  return 1.35; 
}

function Peg({ peg }: { peg: PegDef }) {
  return (
    <div
      className="absolute rounded-full border-[3px] border-white/70"
      style={{
        left: peg.cx - peg.r,
        top: peg.cy - peg.r,
        width: peg.r * 2,
        height: peg.r * 2,
        background: "#C9B089",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
    />
  );
}

function GearSprite({
  gear,
  spinning,
  onPointerDown,
}: {
  gear: Gear;
  spinning: boolean;
  onPointerDown: (e: React.PointerEvent, gearId: string) => void;
}) {
  const src = gearSrc(gear.teeth);
  const pegR = gear.teeth === 8 ? 12 : gear.teeth === 12 ? 14 : 16;

  const dir = gear.pegId && ["p2", "p4"].includes(gear.pegId) ? -1 : 1;
  const sec = spinSecondsForTeeth(gear.teeth);

  return (
    <div
      className="absolute select-none"
      style={{
        left: gear.x,
        top: gear.y,
        width: gear.size,
        height: gear.size,
        touchAction: "none",
      }}
      onPointerDown={(e) => onPointerDown(e, gear.id)}
    >
      <div
        className="h-full w-full"
        style={{
          transformOrigin: "50% 50%",
          animation:
            spinning && gear.pegId
              ? `spin_${dir > 0 ? "cw" : "ccw"} ${sec}s linear infinite`
              : "none",
        }}
      >
        <Image
          src={src}
          alt={`${gear.teeth}-tooth gear`}
          draggable={false}
          priority
          className="pointer-events-none h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {gear.pegId ? (
        <div
          className="absolute rounded-full border-[3px] border-white/70"
          style={{
            left: gear.size / 2 - pegR,
            top: gear.size / 2 - pegR,
            width: pegR * 2,
            height: pegR * 2,
            background: "#C9B089",
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          }}
        />
      ) : null}
    </div>
  );
}

export default function Gears() {
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [spinning, setSpinning] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);

  const pegs = useMemo<PegDef[]>(
    () => [
      // left small
      { id: "p1", cx: 156, cy: 210, r: 16 },
      // upper-left
      { id: "p2", cx: 215, cy: 195, r: 16 },
      // big center
      { id: "p3", cx: 370, cy: 235, r: 16 },
      // middle small
      { id: "p4", cx: 530, cy: 235, r: 16 },
      // big right
      { id: "p5", cx: 685, cy: 200, r: 16 },
    ],
    []
  );

  const initialGears = useMemo<Gear[]>(
    () => [
      { id: "g24a", teeth: 24, x: 90, y: 470, size: 265, pegId: null },
      { id: "g24b", teeth: 24, x: 360, y: 470, size: 265, pegId: null },

      { id: "g12a", teeth: 12, x: 615, y: 460, size: 165, pegId: null },
      { id: "g12b", teeth: 12, x: 615, y: 580, size: 165, pegId: null },

      { id: "g8a", teeth: 8, x: 740, y: 540, size: 120, pegId: null },
      { id: "g8b", teeth: 8, x: 945, y: 382, size: 120, pegId: null },
    ],
    []
  );

  const [gears, setGears] = useState<Gear[]>(initialGears);

  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
    null
  );

  function onPointerDown(e: React.PointerEvent, gearId: string) {
    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const gx = e.clientX - rect.left;
    const gy = e.clientY - rect.top;

    const g = gears.find((x) => x.id === gearId);
    if (!g) return;

    dragRef.current = {
      id: gearId,
      offsetX: gx - g.x,
      offsetY: gy - g.y,
    };

    (e.currentTarget as any).setPointerCapture?.(e.pointerId);

    setGears((prev) => {
      const idx = prev.findIndex((z) => z.id === gearId);
      if (idx < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.push(item);
      return copy;
    });

    setChecked(false);
    setScore(null);
    setMsg("");
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag || !board) return;

    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left - drag.offsetX;
    const y = e.clientY - rect.top - drag.offsetY;

    setGears((prev) =>
      prev.map((g) => (g.id === drag.id ? { ...g, x, y, pegId: null } : g))
    );
  }

  function onPointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    setGears((prev) => {
      const g = prev.find((z) => z.id === drag.id);
      if (!g) return prev;

      const c = centerOfGear(g);
      const nearest = pegs
        .map((p) => ({
          p,
          d2: dist2({ x: c.cx, y: c.cy }, { x: p.cx, y: p.cy }),
        }))
        .sort((a, b) => a.d2 - b.d2)[0];

      const SNAP_R = 46;
      if (!nearest || nearest.d2 > SNAP_R * SNAP_R) return prev;

      const already = prev.some((x) => x.pegId === nearest.p.id);
      if (already) return prev;

      return prev.map((x) => (x.id === g.id ? snapGearToPeg(x, nearest.p) : x));
    });
  }

  function checkAnswer() {
    setChecked(true);

    const teethAtPeg = (pegId: string) =>
      gears.find((g) => g.pegId === pegId)?.teeth ?? null;

    const t1 = teethAtPeg("p1");
    const t2 = teethAtPeg("p2");
    const t3 = teethAtPeg("p3");
    const t4 = teethAtPeg("p4");
    const t5 = teethAtPeg("p5");

    const ok = t1 === 8 && t2 === 12 && t3 === 24 && t4 === 12 && t5 === 24;

    if (ok) {
      setScore(100);
      setMsg("Correct! Nice gear train. (Max reduction target achieved.)");
    } else {
      setScore(0);
      setMsg("Not quite. Try using smaller gears early and larger gears later for more reduction.");
    }

    setSpinning(true);
    window.setTimeout(() => setSpinning(false), 1800);
  }

  function reset() {
    setGears(initialGears);
    setChecked(false);
    setScore(null);
    setMsg("");
    setSpinning(false);
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <style jsx>{`
        @keyframes spin_cw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin_ccw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xl font-semibold text-neutral-900">
              Gear Ratio Reduction
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Design a train so the output rotates in the same direction as the
              input and has the <span className="font-semibold">largest reduction</span>{" "}
              possible. What gears do you use and <span className="font-semibold">what is the ratio</span>?
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={checkAnswer}
              className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
            >
              Check Answer
            </button>
          </div>
        </div>

        {checked && (
          <div
            className={[
              "mt-5 rounded-xl border px-4 py-3 text-sm font-semibold",
              score === 100
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900",
            ].join(" ")}
          >
            {msg}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-4">
            <div
              ref={boardRef}
              className="relative overflow-hidden rounded-2xl bg-[#EFEFEF]"
              style={{ height: 750 }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />

              <div
                className="absolute left-6 right-6 bottom-0 rounded-2xl border border-neutral-200 bg-white/55 backdrop-blur"
                style={{ height: 300 }}
              />

              {pegs.map((p) => (
                <Peg key={p.id} peg={p} />
              ))}

              {gears.map((g) => (
                <GearSprite
                  key={g.id}
                  gear={g}
                  spinning={spinning}
                  onPointerDown={onPointerDown}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <SpeechFeedback problemText="Draw the stress–strain curve for aluminum." />
    </div>
  );
}



