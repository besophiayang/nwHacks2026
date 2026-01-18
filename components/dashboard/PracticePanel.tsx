"use client";

import { useState } from "react";
import CoursesTabs from "@/components/dashboard/CoursesTabs";
import ProblemList from "@/components/dashboard/ProblemList";

export default function PracticePanel() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="mt-6">
      <CoursesTabs selected={selectedCategory} onChange={setSelectedCategory} />
      <div className="mt-6 pb-6">
        <ProblemList selectedCategory={selectedCategory} />
      </div>
    </div>
  );
}
