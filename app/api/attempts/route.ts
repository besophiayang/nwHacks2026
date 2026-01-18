import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const problem_id = body?.problem_id as string | undefined;
  if (!problem_id) return NextResponse.json({ error: "Missing problem_id" }, { status: 400 });

  const { error } = await supabase
    .from("problem_attempts")
    .delete()
    .eq("user_id", user.id)
    .eq("problem_id", problem_id)
    .eq("status", "solved");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
