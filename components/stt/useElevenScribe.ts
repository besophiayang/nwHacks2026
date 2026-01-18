"use client";

import { useCallback, useMemo, useState } from "react";
import { useScribe } from "@elevenlabs/react";

async function fetchTokenFromServer() {
  const r = await fetch("/api/elevenlabs-token", { method: "GET" });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Token error: HTTP ${r.status} ${t}`.trim());
  }
  const d = await r.json().catch(() => ({}));
  const token = d?.token ?? d?.data?.token;
  if (!token) throw new Error("Token error: missing token in response");
  return token as string;
}

export function useElevenScribe() {
  const [finalTranscript, setFinalTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onCommittedTranscript: (data: { text: string }) => {
      const text = data?.text ?? "";
      if (!text) return;
      setFinalTranscript((prev) => (prev ? prev + " " : "") + text);
    },
  });

  const transcript = useMemo(() => finalTranscript, [finalTranscript]);

  const start = useCallback(async () => {
    setSttError(null);
    setShowTranscript(false);
    setFinalTranscript("");

    try {
      const token = await fetchTokenFromServer();
      await scribe.connect({
        token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (e: any) {
      setSttError(e?.message ?? "Speech-to-text error");
      try {
        if (scribe.isConnected) scribe.disconnect();
      } catch {}
    }
  }, [scribe]);

  const stop = useCallback(async () => {
    setSttError(null);
    setShowTranscript(true);

    try {
      try {
        scribe.commit();
      } catch {}

      await new Promise((r) => setTimeout(r, 1000));
      scribe.disconnect();
    } catch (e: any) {
      setSttError(e?.message ?? "Speech-to-text error");
      try {
        if (scribe.isConnected) scribe.disconnect();
      } catch {}
    }
  }, [scribe]);

  const toggle = useCallback(async () => {
    if (scribe.isConnected) return stop();
    return start();
  }, [scribe.isConnected, start, stop]);

  return {
    isConnected: scribe.isConnected,
    transcript: finalTranscript,
    sttError,
    showTranscript,
    toggle,
    stop,
    start,
    setShowTranscript,
    setFinalTranscript,
  };
}
