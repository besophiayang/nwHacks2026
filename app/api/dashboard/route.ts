import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // 1) fetch problems
  const { data: problems, error: pErr } = await supabase
    .from("problems")
    .select("id,title,link,category,difficulty,created_at")
    .order("created_at", { ascending: false });

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Map problem_id -> category (for weekly stacked bars)
  const categoryByProblemId = new Map<string, string>();
  for (const p of problems ?? []) categoryByProblemId.set((p as any).id, (p as any).category);

  // 2) fetch attempts for recent window (used for weekly + streak + solvedProblemIds)
  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data: attempts, error: aErr } = await supabase
    .from("problem_attempts")
    .select("problem_id,status,submitted_at")
    .eq("user_id", user.id)
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: false });

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const solvedProblemIds = Array.from(
    new Set(
      (attempts ?? [])
        .filter((a: any) => a.status === "solved")
        .map((a: any) => a.problem_id)
    )
  );

  // 3) NEW: fetch best_score per problem from problem_progress (this is what your /api/progress writes)
  const { data: progressRows, error: prErr } = await supabase
    .from("problem_progress")
    .select("problem_id,best_score")
    .eq("user_id", user.id);

  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });

  const bestScoreByProblemId = new Map<string, number>();
  for (const row of progressRows ?? []) {
    const pid = (row as any).problem_id as string;
    const s = Number((row as any).best_score ?? 0);
    bestScoreByProblemId.set(pid, s);
  }

  // 4) attach best_score onto each problem row
  const problemsWithScores = (problems ?? []).map((p: any) => ({
    ...p,
    best_score: bestScoreByProblemId.get(p.id) ?? 0,
  }));

  // weekly (Sun..Sat) for current week
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const weekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - day));
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startOfDay(new Date(weekStart.getTime() + i * 86400000))
  );

  const weeklySolved = new Array(7).fill(0);
  for (const a of attempts ?? []) {
    if ((a as any).status !== "solved") continue;
    const dt = startOfDay(new Date((a as any).submitted_at));
    for (let i = 0; i < 7; i++) {
      if (sameDay(dt, weekDays[i])) weeklySolved[i] += 1;
    }
  }

  // weekly by category (stacked)
  const weeklyByCategory: Record<string, number[]> = {};
  function ensureCat(cat: string) {
    if (!weeklyByCategory[cat]) weeklyByCategory[cat] = [0, 0, 0, 0, 0, 0, 0];
  }

  for (const a of attempts ?? []) {
    if ((a as any).status !== "solved") continue;
    const pid = (a as any).problem_id as string;
    const cat = categoryByProblemId.get(pid);
    if (!cat) continue;

    const dt = startOfDay(new Date((a as any).submitted_at));
    for (let i = 0; i < 7; i++) {
      if (sameDay(dt, weekDays[i])) {
        ensureCat(cat);
        weeklyByCategory[cat][i] += 1;
      }
    }
  }

  // streak (based on solved days)
  const solvedDaysSet = new Set<string>();
  for (const a of attempts ?? []) {
    if ((a as any).status !== "solved") continue;
    const d = startOfDay(new Date((a as any).submitted_at));
    solvedDaysSet.add(d.toISOString().slice(0, 10));
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (solvedDaysSet.has(key)) streak += 1;
    else break;
  }

  return NextResponse.json({
    problems: problemsWithScores,
    solvedProblemIds,
    weeklySolved,
    weeklyByCategory,
    streak,
  });
}
