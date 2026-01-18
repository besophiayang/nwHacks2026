import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ELEVEN_LABS_API_KEY" }, { status: 500 });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });

    const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");

    return NextResponse.json(token);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: `ElevenLabs token request failed`,
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}

