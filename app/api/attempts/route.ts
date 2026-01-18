import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const problemId = String(body.problemId ?? body.problem_id ?? "").trim();
  const statusRaw = String(body.status ?? "").trim().toLowerCase();

  if (!problemId) {
    return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
  }

  if (statusRaw !== "solved" && statusRaw !== "attempted") {
    return NextResponse.json({ error: "status must be 'solved' or 'attempted'" }, { status: 400 });
  }

  const submitted_at =
    typeof body.submitted_at === "string" && body.submitted_at
      ? body.submitted_at
      : new Date().toISOString();

  const { error } = await supabase.from("problem_attempts").insert({
    user_id: user.id,
    problem_id: problemId,
    status: statusRaw,
    submitted_at,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
