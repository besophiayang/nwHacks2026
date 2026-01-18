import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import PracticePanel from "@/components/dashboard/PracticePanel";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 px-6 pt-6">
          <TopBar />
          <div className="w-full">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <StatCards />
              </div>
              <div className="hidden lg:block" />
            </div>
          </div>
          <div className="mt-6 w-full">
            <PracticePanel />
          </div>
        </div>
      </div>
    </main>
  );
}




