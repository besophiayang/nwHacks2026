import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import ProblemRenderer from "@/components/problems/ProblemRenderer";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ link: string }>;
}) {
  const { link } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) redirect("/email-password");

  const { data: problem, error } = await supabase
    .from("problems")
    .select("id,title,link,category,difficulty")
    .eq("link", link)
    .single();

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Problem not found</div>
          <div className="mt-2 text-sm text-neutral-500">
            ERROR: {error?.message ?? "none"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-pink-400" />
            <div className="text-sm font-semibold text-neutral-900">
              {problem.title}
            </div>
            <div className="text-sm font-semibold text-emerald-600">
              [{String(problem.difficulty).toUpperCase()}]
            </div>
          </div>

          <Link
            href="/dashboard"
            className="text-sm font-semibold text-red-500 hover:opacity-80"
          >
            Quit
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="rounded-2xl bg-neutral-200/60 p-6">
          <div className="mt-6">
            <ProblemRenderer link={link} problemId={problem.id} />
          </div>
        </div>
      </div>
    </div>
  );
}