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
          <div className="mt-8 w-full lg:mt-10">
            <div className="w-full">
              <div className="lg:col-span-2">
                <StatCards />
              </div>
              <div className="hidden lg:block" />
            </div>
          </div>
          <div className="mt-8 w-full lg:mt-10">
            <PracticePanel />
          </div>
        </div>
      </div>
    </main>
  );
}




