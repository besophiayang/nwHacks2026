import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { problemId, score } = await req.json();
  const s = Math.max(0, Math.min(100, Math.round(Number(score ?? 0))));

  const { data, error } = await supabase
    .from("problem_progress")
    .upsert(
      {
        user_id: user.id,
        problem_id: problemId,
        best_score: s,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,problem_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, row: data });
}
