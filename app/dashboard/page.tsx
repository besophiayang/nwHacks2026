import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import CoursesTabs from "@/components/dashboard/CoursesTabs";
import ProblemList from "@/components/dashboard/ProblemList";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <TopBar />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StatCards />
              <div className="mt-6">
                <CoursesTabs />
              </div>
              <div className="mt-6">
                <ProblemList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
