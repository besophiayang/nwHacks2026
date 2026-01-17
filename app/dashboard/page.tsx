import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import CoursesTabs from "@/components/dashboard/CoursesTabs";
import ProblemList from "@/components/dashboard/ProblemList";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 px-6 pt-6">
          <TopBar />

          <div className="mx-auto w-full max-w-6xl p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <StatCards />

                <div className="mt-6">
                  <CoursesTabs />
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>
          </div>

          <div className="mt-6 pb-6">
            <ProblemList />
          </div>
        </div>
      </div>
    </main>
  );
}


