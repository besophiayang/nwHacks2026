import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type AnalyzeBody = {
  transcript: string;
  problemText?: string;
};

function extractJsonObject(raw: string): string | null {
  if (!raw) return null;

  let s = raw.trim();
  s = s.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  try {
    JSON.parse(s);
    return s;
  } catch {
  }

  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  const candidate = s.slice(first, last + 1).trim();
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

function clamp0to100(n: any): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function normFiller(f: any) {
  const countsIn = (f?.counts ?? {}) as Record<string, any>;
  const counts = {
    um: Number(countsIn.um) || 0,
    uh: Number(countsIn.uh) || 0,
    like: Number(countsIn.like) || 0,
    you_know: Number(countsIn.you_know) || 0,
    so: Number(countsIn.so) || 0,
  };

  return {
    total: Number(f?.total) || Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0),
    counts,
    highlights: Array.isArray(f?.highlights) ? f.highlights.slice(0, 8).map(String) : [],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeBody;
    const transcript = (body.transcript ?? "").trim();
    const problemText = (body.problemText ?? "").trim();

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are grading a student's spoken explanation of an engineering interview question.

      Question (context):
      ${problemText || "(not provided)"}

      Transcript:
      ${transcript}

      You MUST output ONLY a single valid JSON object.
      - No markdown, no code fences, no extra text, no trailing commas.
      - Do NOT wrap in an array.
      - Do NOT include commentary.

      Return this exact schema:
      {
        "clarity": number,
        "correctness": number,
        "filler": {
          "total": number,
          "counts": { "um": number, "uh": number, "like": number, "you_know": number, "so": number },
        },
        "notes": string[]
      }
      `.trim();

    const model = "gemini-2.5-flash";

    const resp = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const raw = (resp.text ?? "").trim();

    const jsonStr = extractJsonObject(raw);
    if (!jsonStr) {
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw },
        { status: 502 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw },
        { status: 502 }
      );
    }

    const out = {
      clarity: clamp0to100(parsed?.clarity),
      correctness: clamp0to100(parsed?.correctness),
      filler: normFiller(parsed?.filler),
      notes: Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 6).map(String) : [],
    };

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

