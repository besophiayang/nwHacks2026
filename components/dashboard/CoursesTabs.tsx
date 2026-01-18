const tabs = [
  { label: "All", cls: "bg-neutral-100 text-neutral-700" },
  { label: "Solid Mechanics", cls: "bg-red-100 text-red-600" },
  { label: "Fluid Dynamics", cls: "bg-green-100 text-green-700" },
  { label: "Materials", cls: "bg-purple-100 text-purple-700" },
  { label: "Thermodynamics", cls: "bg-yellow-100 text-yellow-700" },
  { label: "Manufacturing", cls: "bg-blue-100 text-blue-700" },
  { label: "Calculations", cls: "bg-neutral-200 text-neutral-700" },
];

export default function CoursesTabs({
  selected,
  onChange,
}: {
  selected: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-neutral-800">
        Technical Problems
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const value = t.label.toLowerCase(); 
          const isActive = selected === value;

          return (
            <button
              key={t.label}
              type="button"
              onClick={() => onChange(value)} 
              className={[
                "rounded-xl px-4 py-2 text-xs font-semibold",
                "transition-all hover:shadow-md hover:-translate-y-[1px]",
                isActive ? "ring-2 ring-neutral-900/10" : "",
                t.cls,
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}