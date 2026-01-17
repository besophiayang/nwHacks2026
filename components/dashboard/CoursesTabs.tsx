const tabs = [
  { label: "Solid Mechanics", cls: "bg-red-100 text-red-600" },
  { label: "Fluid Dynamics", cls: "bg-green-100 text-green-700" },
  { label: "Materials", cls: "bg-purple-100 text-purple-700" },
  { label: "Thermodynamics", cls: "bg-yellow-100 text-yellow-700" },
  { label: "Manufacturing", cls: "bg-blue-100 text-blue-700" },
  { label: "Calculations", cls: "bg-neutral-200 text-neutral-700" },
];

export default function CoursesTabs() {
  return (
    <div>
      <h2 className="text-base font-semibold text-neutral-800">My Courses</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.label}
            className={`rounded-xl px-4 py-2 text-xs font-semibold ${t.cls}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}