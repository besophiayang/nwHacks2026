export default function TopBar() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
          <span className="text-neutral-400">🔍︎</span>
          <input
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            placeholder="Search"
          />
        </div>
      </div>

      <button className="rounded-2xl bg-white px-4 py-3 shadow-sm">⩍</button>
      <div className="h-11 w-11 rounded-2xl bg-neutral-300 shadow-sm" />
    </div>
  );
}