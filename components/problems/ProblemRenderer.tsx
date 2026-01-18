"use client";

import * as TrussOptimizationMod from "./TrussOptimization";
import * as StressSrainSteelMod from "./StressStrainSteel";
<<<<<<< HEAD
import * as ManufacturingMod from "./Manufacturing";
import * as GearsMod from "./Gears";

=======
import * as StressStrainAluminumMod from "./StressStrainAluminum";

const StressStrainAluminum =
  (StressStrainAluminumMod as any).default ?? (StressStrainAluminumMod as any);
>>>>>>> 9d04e6bb68e9594e8b699c7cca8069e1786962ba

const StressStrainSteel =
  (StressSrainSteelMod as any).default ?? (StressSrainSteelMod as any);

const TrussOptimization =
  (TrussOptimizationMod as any).default ?? (TrussOptimizationMod as any);

const Manufacturing =
  (ManufacturingMod as any).default ?? (ManufacturingMod as any);

const Gears =
  (GearsMod as any).default ?? (GearsMod as any);

export default function ProblemRenderer({ link, problemId }: { link: string; problemId: string }) {
    
  switch (link) {
    case "truss-optimization":
      return <TrussOptimization problemId={problemId}/>;

    case "stress-strain-steel":
        return <StressStrainSteel problemId={problemId}/>;

<<<<<<< HEAD
    case "manufacturing":
        return <Manufacturing problemId={problemId}/>;

    case "gear-ratio":
        return <Gears problemId={problemId}/>;
=======
    case "stress-strain-aluminum":
        return <StressStrainAluminum problemId={problemId}/>;
>>>>>>> 9d04e6bb68e9594e8b699c7cca8069e1786962ba

    default:
      return (
        <div className="rounded-xl bg-white p-6 text-sm text-neutral-700">
          No UI
        </div>
      );
  }
}