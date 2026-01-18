"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/images/Logo.png";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";

const mainItems = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Profile", href: "/profile" },
];

const settings = [
  { label: "Settings", href: "/settings" },
  { label: "Courses", href: "/courses" },
];

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="text-neutral-700"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="text-neutral-700"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 6 9 12l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/email-password");
    router.refresh();
  }

  return (
    <aside
      className={[
        "hidden lg:block min-h-screen shrink-0 bg-neutral-50 border-r border-neutral-200/70",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-14" : "w-64",
      ].join(" ")}
    >
      <div
        className={[
          "sticky top-0 z-10 bg-neutral-50",
          "flex items-center",
          collapsed ? "justify-center px-2 py-4" : "justify-between px-6 py-6",
        ].join(" ")}
      >
        {!collapsed && (
          <Image
            src={Logo}
            alt="Logo"
            width={96}
            height={96}
            className="h-12 w-12 object-contain sm:h-24 sm:w-24"
            priority
          />
        )}

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
          className="rounded-lg p-2 hover:bg-white hover:shadow-sm"
        >
          {collapsed ? <HamburgerIcon /> : <CollapseIcon />}
        </button>
      </div>

      <div
        className={[
          "transition-[opacity] duration-200 ease-out",
          collapsed ? "pointer-events-none opacity-0 h-0 overflow-hidden" : "opacity-100 px-6 pb-8",
        ].join(" ")}
      >
        <div className="mt-4">
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
      </div>
    </aside>
  );
}
