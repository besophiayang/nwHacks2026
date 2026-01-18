"use client";

import React, { useMemo, useState } from "react";
import Image, { StaticImageData } from "next/image";

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
};

function Peg({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <div
      className="absolute rounded-full border-[3px] border-white/70"
      style={{
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        background: "#C9B089",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
    />
  );
}

function gearSrc(teeth: GearSize): StaticImageData {
  if (teeth === 8) return gear8;
  if (teeth === 12) return gear12;
  return gear24;
}

function GearSprite({ gear }: { gear: Gear }) {
  const src = gearSrc(gear.teeth);

  const pegR = gear.teeth === 8 ? 12 : gear.teeth === 12 ? 14 : 16;

  return (
    <div
      className="absolute select-none"
      style={{ left: gear.x, top: gear.y, width: gear.size, height: gear.size }}
    >
      <Image
        src={src}
        alt={`${gear.teeth}-tooth gear`}
        draggable={false}
        priority
        className="pointer-events-none h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />
      <Peg cx={gear.size / 2} cy={gear.size / 2} r={pegR} />
    </div>
  );
}

export default function Gears() {
  const [checked, setChecked] = useState(false);

  // ✅ shift everything left + scale up again
  const gears = useMemo<Gear[]>(
    () => [
      { id: "g8a", teeth: 8, x: 115, y: 300, size: 118 },
      { id: "g12a", teeth: 12, x: 175, y: 205, size: 164 },
      { id: "g24a", teeth: 24, x: 285, y: 195, size: 285 },
      { id: "g12b", teeth: 12, x: 545, y: 275, size: 164 },
      { id: "g24b", teeth: 24, x: 640, y: 155, size: 330 },
      { id: "g8b", teeth: 8, x: 730, y: 395, size: 128 },
    ],
    []
  );

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xl font-semibold text-neutral-900">
              Gear Ratio Reduction
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Design a train so the output rotates in the same direction as the input
              and has the <span className="font-semibold">largest reduction</span>{" "}
              possible.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setChecked(false)}
              className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setChecked(true)}
              className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
            >
              Check Answer
            </button>
          </div>
        </div>

        {checked && (
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800">
            Answer checking is disabled on this placeholder screen.
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm leading-6 text-neutral-700">
            You have six gears available: two 24-tooth gears, two 12-tooth gears,
            and two 8-tooth gears. You may build a gear train using any number of
            gears, but the output gear must rotate in the{" "}
            <span className="font-semibold">same direction</span> as the input.
            <div className="mt-3">
              <span className="font-semibold">Task:</span> Arrange the gears to achieve the{" "}
              <span className="font-semibold">largest speed reduction</span> (slowest output).
              State which gears you use and the resulting ratio.
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[#F7F7F7] p-4">
            <div
              className="relative overflow-hidden rounded-2xl bg-[#EFEFEF]"
              style={{ height: 520 }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
              {gears.map((g) => (
                <GearSprite key={g.id} gear={g} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
