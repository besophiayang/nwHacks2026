"use client";

import * as TrussOptimizationMod from "./TrussOptimization";
import * as StressSrainSteelMod from "./StressStrainSteel";
import * as StressStrainAluminumMod from "./StressStrainAluminum";

const StressStrainAluminum =
  (StressStrainAluminumMod as any).default ?? (StressStrainAluminumMod as any);

const StressStrainSteel =
  (StressSrainSteelMod as any).default ?? (StressSrainSteelMod as any);

const TrussOptimization =
  (TrussOptimizationMod as any).default ?? (TrussOptimizationMod as any);

export default function ProblemRenderer({ link, problemId }: { link: string; problemId: string }) {
    
  switch (link) {
    case "truss-optimization":
      return <TrussOptimization problemId={problemId}/>;

    case "stress-strain-steel":
        return <StressStrainSteel problemId={problemId}/>;

    case "stress-strain-aluminum":
        return <StressStrainAluminum problemId={problemId}/>;

    default:
      return (
        <div className="rounded-xl bg-white p-6 text-sm text-neutral-700">
          No UI
        </div>
      );
  }
}