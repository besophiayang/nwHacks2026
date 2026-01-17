"use client";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/images/Logo.png";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";


const mainItems = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Profile", href: "/profile" },
];

const settings = [
  { label: "Settings", href: "/settings" },
  { label: "Courses", href: "/courses" },
];

export default function Sidebar() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/email-password");
        router.refresh();
    }
  return (
    <aside className="hidden min-h-screen w-64 bg-neutral-50 px-6 py-8 lg:block">
      <div className="text-2xl font-semibold tracking-tight text-neutral-800">
        <Image
                src={Logo}
                alt="Logo"
                width={96}
                height={96}
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                priority
              />
      </div>

      <div className="mt-10">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Main Menu
        </div>

        <nav className="mt-3 space-y-1">
          {mainItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "block rounded-xl px-4 py-3 text-sm",
                item.active
                  ? "bg-white text-red-500 shadow-sm"
                  : "text-neutral-700 hover:bg-white hover:shadow-sm",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-10">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Settings
        </div>

        <nav className="mt-3 space-y-1">
          {settings.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm text-neutral-700 hover:bg-white hover:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-700 hover:bg-white hover:shadow-sm"
            >
            Log Out
            </button>
        </nav>
      </div>
    </aside>
  );
}