"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  GitFork,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { writeSession } from "@/lib/storage";

export function AuthScreen({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);
  const configured = isSupabaseConfigured();

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Google sign-in is not configured yet.");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setMessage("Unable to start Google sign-in. Please try again.");
      setBusy(false);
    }
  }

  function enterDemo() {
    writeSession({ email: "darsh@example.com", name: "Darsh", mode: "demo" });
    router.push("/projects");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!configured) {
      setMessage(
        "Account authentication is not connected yet. Use the demo workspace to explore Kova.",
      );
      return;
    }

    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const result =
      authMode === "signin"
        ? await supabase!.auth.signInWithPassword({ email, password })
        : await supabase!.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }

    if (authMode === "signup" && !result.data.session) {
      setMessage("Check your inbox to confirm the new account.");
      setBusy(false);
      return;
    }

    writeSession({ email, name: email.split("@")[0], mode: "supabase" });
    router.push("/projects");
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-labelledby="auth-title">
        <BrandMark context="Architect 2.0" />
        <div className="auth-story-copy">
          <span className="eyebrow">One shared product workspace</span>
          <h1 id="auth-title">
            From an idea to production, without losing control.
          </h1>
          <p>
            Plan with stakeholders, build with agents, inspect the code, verify
            the result and ship from one traceable project.
          </p>
        </div>

        <div className="auth-workflow" aria-label="Kova product lifecycle">
          {["Intent", "Plan", "Build", "Verify", "Ship"].map((step, index) => (
            <div className="auth-workflow-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
              {index < 4 ? (
                <ArrowRight aria-hidden="true" />
              ) : (
                <Check aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="auth-evidence">
          <div className="evidence-status">
            <span />
            Last build verified
          </div>
          <p>12 requirements · 34 tests · 0 blockers</p>
          <div className="evidence-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-label="Account access">
        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-icon">
              <Sparkles aria-hidden="true" />
            </span>
            <div>
              <h2>
                {authMode === "signin"
                  ? "Welcome back"
                  : "Create your workspace"}
              </h2>
              <p>
                {authMode === "signin"
                  ? "Continue building where your team left off."
                  : "Start with a working Kova project."}
              </p>
            </div>
          </div>

          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              className={authMode === "signin" ? "is-active" : ""}
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={authMode === "signup" ? "is-active" : ""}
              onClick={() => setAuthMode("signup")}
            >
              Create account
            </button>
          </div>

          {configured && (
            <button
              className="button secondary wide"
              type="button"
              disabled={busy}
              onClick={signInWithGoogle}
            >
              Continue with Google
            </button>
          )}

          <button
            className="button secondary wide"
            type="button"
            onClick={enterDemo}
          >
            <GitFork aria-hidden="true" /> Continue with demo workspace
          </button>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form onSubmit={submit} className="auth-form">
            <label className="field">
              <span>Work email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  authMode === "signin" ? "current-password" : "new-password"
                }
                minLength={8}
                required
              />
            </label>
            {message ? (
              <p className="form-message" role="status">
                {message}
              </p>
            ) : null}
            <button
              className="button primary wide"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className="spin" aria-hidden="true" />
              ) : null}
              {authMode === "signin" ? "Continue to Kova" : "Create workspace"}
              {busy ? null : <ArrowRight aria-hidden="true" />}
            </button>
          </form>

          <div className="auth-security">
            <LockKeyhole aria-hidden="true" />
            <span>
              {configured
                ? "Supabase authentication connected"
                : "Demo mode active · Supabase ready"}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
