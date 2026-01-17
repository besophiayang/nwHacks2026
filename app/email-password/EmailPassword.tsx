"use client";

import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

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

      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Check your inbox to confirm your new account.");
      }
      return;
    }

    // signin
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
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      {!currentUser ? (
        <>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            {mode === "signup" ? "Sign up" : "Sign in"}
          </h1>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setMode("signup")}>
              Sign up
            </button>
            <button type="button" onClick={() => setMode("signin")}>
              Sign in
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <button type="submit" style={{ width: "100%", padding: 10 }}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          {status && (
            <p style={{ marginTop: 12 }} role="status" aria-live="polite">
              {status}
            </p>
          )}
        </>
      ) : (
        <div>
          <p style={{ marginBottom: 8 }}>
            Signed in as <b>{currentUser.email}</b>
          </p>

          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>

          {status && (
            <p style={{ marginTop: 12 }} role="status" aria-live="polite">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

