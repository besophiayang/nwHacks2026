"use client";

import React, { useState } from "react";
import MicRecorder from "@/components/stt/MicRecorder";
import TranscriptAnalyzer from "@/components/analysis/TranscriptAnalyzer";

export default function SpeechFeedback({
  problemText,
  className = "",
}: {
  problemText?: string;
  className?: string;
}) {
  const [transcript, setTranscript] = useState("");

  return (
    <div className={className}>
      <MicRecorder onTranscriptReady={setTranscript} />
      <TranscriptAnalyzer transcript={transcript} problemText={problemText} />
    </div>
  );
}
