import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type AnalyzeBody = {
  transcript: string;
  problemText?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeBody;
    const transcript = (body.transcript ?? "").trim();
    const problemText = (body.problemText ?? "").trim();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are grading a student's spoken explanation of an engineering interview question.

Question (context):
${problemText || "(not provided)"}

Transcript:
${transcript}

Return ONLY valid JSON with this exact schema:
{
  "clarity": number,        // 0-100, how clear/structured the explanation is
  "correctness": number,    // 0-100, how technically correct it is relative to the question
  "filler": {
    "total": number,
    "counts": { "um": number, "uh": number, "like": number, "you_know": number, "so": number },
    "highlights": string[]  // up to 8 short snippets from the transcript showing filler usage
  },
  "notes": string[]         // up to 6 short bullet notes on what to improve
}

Rules:
- Be conservative: if the transcript doesn't mention technical content, correctness must be low.
- Count filler words case-insensitively.
- "you know" counts as you_know.
- Return JSON only. No markdown.
`.trim();

    const model = "gemini-2.5-flash";

    const resp = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = resp.text?.trim() ?? "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw: text },
        { status: 502 }
      );
    }

    const clamp = (n: any) =>
      Math.max(0, Math.min(100, Number.isFinite(+n) ? +n : 0));

    const out = {
      clarity: clamp(parsed?.clarity),
      correctness: clamp(parsed?.correctness),
      filler: parsed?.filler ?? { total: 0, counts: {}, highlights: [] },
      notes: Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 6) : [],
    };

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
