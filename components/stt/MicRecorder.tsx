"use client";

import React, { useEffect } from "react";
import { useElevenScribe } from "./useElevenScribe";

export default function MicRecorder({
  title = "Interview Transcript",
  onFinalTranscript,
  className = "",
  onTranscriptReady,
}: {
  title?: string;
  onFinalTranscript?: (text: string) => void;
  className?: string;
  onTranscriptReady?: (text: string) => void;
}) {
  const { isConnected, transcript, sttError, showTranscript, toggle, stop } =
    useElevenScribe();

  useEffect(() => {
    if (!onTranscriptReady) return;
    if (showTranscript && !isConnected) onTranscriptReady(transcript);
  }, [showTranscript, isConnected, transcript, onTranscriptReady]);
  
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={[
            "grid h-11 w-11 place-items-center rounded-full",
            "bg-neutral-100 text-neutral-900 shadow-sm",
            "transition hover:shadow-md active:scale-[0.98]",
            isConnected ? "ring-2 ring-emerald-500" : "",
          ].join(" ")}
          onClick={toggle}
          aria-label={isConnected ? "Stop recording" : "Start recording"}
        >
          <span className="text-base">{isConnected ? "■" : "▶︎"}</span>
        </button>

        <div className="text-sm text-neutral-600">
          {isConnected ? "Recording..." : "Record your explanation"}
        </div>

        {isConnected ? (
          <button
            type="button"
            onClick={stop}
            className="ml-auto rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Stop
          </button>
        ) : null}
      </div>

      {sttError && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sttError}
        </div>
      )}

      {showTranscript && !isConnected && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-800">{title}</div>
          {transcript ? (
            <div className="mt-3 whitespace-pre-wrap text-sm text-neutral-800">
              {transcript}
            </div>
          ) : (
            <div className="mt-3 text-sm text-neutral-400">
              No transcript captured.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
