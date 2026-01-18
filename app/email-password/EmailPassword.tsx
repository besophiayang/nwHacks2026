"use client";

import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

import Logo from "@/images/logo.png";
import LoginSlogan from "@/images/login slogan.png";

type EmailPasswordProp = {
  user: User | null;
};

type Mode = "signup" | "signin";

export default function EmailPasswordDemo({ user }: EmailPasswordProp) {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(error.message);
      return;
    }
    setCurrentUser(null);
    setStatus("Signed out successfully.");
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });

      if (error) setStatus(error.message);
      else setStatus("Check your inbox to confirm your new account.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <section className="relative w-full bg-white md:basis-[40%] md:flex-none">
          <div className="relative h-full px-10 py-10 sm:px-14">
            <div className="absolute left-8 top-8 sm:left-10 sm:top-10">
              <Image
                src={Logo}
                alt="Logo"
                width={96}
                height={96}
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                priority
              />
            </div>

            {!currentUser ? (
              <div className="pt-44">
                <h1 className="text-3xl font-medium tracking-tight text-neutral-900">
                  {mode === "signup" ? "Sign Up" : "Log In"}
                </h1>

                <form onSubmit={handleSubmit} className="mt-10 space-y-7">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-3 w-full border-0 border-b border-neutral-300 bg-transparent px-0 pb-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="mt-3 w-full border-0 border-b border-neutral-300 bg-transparent px-0 pb-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-0"
                    />
                    <p className="mt-2 text-xs text-neutral-400">
                      {mode === "signup" ? "Minimum 6 characters" : "Enter your password"}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 w-full bg-black py-3 text-sm font-medium text-white transition hover:bg-neutral-900 active:bg-black"
                  >
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs text-neutral-400">
                  <span className="uppercase tracking-wider">
                    {mode === "signup" ? "Already have an account?" : "Don't have an account?"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
                  >
                    {mode === "signup" ? "Log In" : "Create account"}
                  </button>
                </div>

                {status && (
                  <p className="mt-6 text-sm text-neutral-700" role="status" aria-live="polite">
                    {status}
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-44">
                <h1 className="text-3xl font-medium tracking-tight text-neutral-900">Account</h1>

                <p className="mt-6 text-sm text-neutral-700">
                  Signed in as <b className="text-neutral-900">{currentUser.email}</b>
                </p>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/dashboard");
                      router.refresh();
                    }}
                    className="w-full bg-black py-3 text-sm font-medium text-white hover:bg-neutral-900"
                  >
                    Go to Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full border border-neutral-300 py-3 text-sm font-medium text-neutral-900 hover:border-neutral-900"
                  >
                    Sign out
                  </button>
                </div>

                {status && (
                  <p className="mt-6 text-sm text-neutral-700" role="status" aria-live="polite">
                    {status}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="relative hidden bg-[#efeded] md:block md:flex-1">
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <Image
              src={LoginSlogan}
              alt="Login slogan"
              priority
              className="h-auto w-full max-w-[760px] object-contain"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
