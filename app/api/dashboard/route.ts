import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ problems: [] }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("problems")
    .select("id,title,link,category,difficulty,created_at") 
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { problems: [], error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ problems: data ?? [] });
}
