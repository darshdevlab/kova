"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { writeSession } from "@/lib/storage";
import "@/styles/auth-v3.css";

/**
 * Onboarding integration contract: one Supabase identity for both intents.
 * Read this tab-scoped, untrusted JSON after auth.getUser() verifies the user,
 * in /auth/complete AND the password-sign-in destination. Validate version,
 * fields, 24-hour expiry, and email against the verified user when non-null.
 * create-company requests the existing create-workspace operation with
 * organisationName; select-workspace only selects an existing membership.
 * Use verified user.id for ownership and an idempotent operation keyed by id.
 * Remove only after success; keep on retryable onboarding failures.
 * This intent is never proof of identity, membership, or permission.
 * Confirmation in another tab/device must ask for intent again.
 * Callback/platform consumers are outside this component's ownership.
 */
export const AUTH_PENDING_INTENT_KEY = "kova:auth:pending-intent:v1";
export type AuthPendingIntent = {
  version: 1;
  id: string;
  intent: "individual" | "organisation";
  action: "create-company" | "select-workspace";
  organisationName: string | null;
  email: string | null;
  createdAt: number;
};
type Mode = "signin" | "signup";
type Busy = "email" | "google" | "recovery" | null;

export function AuthScreen({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<Mode>("signin");
  const [intent, setIntent] = useState<AuthPendingIntent["intent"]>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const inFlight = useRef(false);
  const [message, setMessage] = useState(initialError);
  const [isError, setIsError] = useState(Boolean(initialError));
  const configured = isSupabaseConfigured();
  const signup = authMode === "signup";

  function notify(text: string, error = true) {
    setMessage(text);
    setIsError(error);
  }
  function changeMode(mode: Mode) {
    setAuthMode(mode);
    setPassword("");
    setConfirmation("");
    setMessage("");
  }
  function saveIntent(provider: "email" | "google") {
    const pending: AuthPendingIntent = {
      version: 1, id: crypto.randomUUID(), intent,
      action: signup && intent === "organisation" ? "create-company" : "select-workspace",
      organisationName: signup && intent === "organisation" ? organisationName.trim() : null,
      email: provider === "email" ? email.trim().toLowerCase() : null,
      createdAt: Date.now(),
    };
    try {
      // Keep retries of the same request on one idempotency key.
      let previous: AuthPendingIntent | null = null;
      const stored = sessionStorage.getItem(AUTH_PENDING_INTENT_KEY);
      try {
        previous = stored ? JSON.parse(stored) : null;
      } catch {
        // An invalid draft is replaced, never treated as an authentication error.
      }
      if (previous?.version === 1 && typeof previous.id === "string" &&
          previous.intent === pending.intent && previous.action === pending.action &&
          previous.organisationName === pending.organisationName && previous.email === pending.email &&
          typeof previous.createdAt === "number" && previous.createdAt <= Date.now() &&
          Date.now() - previous.createdAt < 86_400_000) {
        pending.id = previous.id;
        pending.createdAt = previous.createdAt;
      }
      sessionStorage.setItem(AUTH_PENDING_INTENT_KEY, JSON.stringify(pending));
    } catch {
      throw new Error("Allow session storage in your browser, then try again.");
    }
  }
  function validEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  async function signInWithGoogle() {
    if (inFlight.current) return;
    if (signup && intent === "organisation" && !organisationName.trim()) {
      notify("Enter your organisation name before continuing with Google.");
      document.getElementById("auth-organisation")?.focus();
      return;
    }
    inFlight.current = true;
    setBusy("google");
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Authentication is unavailable. Please try again later.");
      saveIntent("google");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to start Google sign-in. Please try again.");
      setBusy(null);
      inFlight.current = false;
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setMessage("");
    if (!configured) return notify("Authentication is unavailable. Please try again later.");
    if (signup && !name.trim()) return notify("Enter your full name.");
    if (signup && intent === "organisation" && !organisationName.trim()) return notify("Enter your organisation name.");
    if (!validEmail()) return notify("Enter a valid email address.");
    // Validate whitespace without changing the user's secret.
    if (!password.trim() || (signup && password.length < 8)) return notify(signup ? "Enter a password with at least 8 characters." : "Enter your password.");
    if (signup && !confirmation.trim()) return notify("Confirm your password.");
    if (signup && password !== confirmation) return notify("Passwords do not match.");
    inFlight.current = true;
    setBusy("email");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Authentication is unavailable. Please try again later.");
      saveIntent("email");
      const result = signup
        ? await client.auth.signUp({
            email: email.trim(), password,
            options: { data: { full_name: name.trim() }, emailRedirectTo: `${location.origin}/auth/callback` },
          })
        : await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (signup && !result.data.session) {
        notify("Check your inbox to confirm the new account.", false);
        setPassword("");
        setConfirmation("");
        return;
      }
      const { data, error } = await client.auth.getUser();
      if (error || !data.user?.email) throw new Error("Your session could not be verified. Please sign in again.");
      writeSession({
        email: data.user.email,
        name: data.user.user_metadata.full_name || name.trim() || data.user.email.split("@")[0],
        mode: "supabase",
      });
      router.push("/projects");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  async function recover() {
    if (inFlight.current) return;
    if (!validEmail()) return notify("Enter a valid email address first.");
    inFlight.current = true;
    setBusy("recovery");
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Authentication is unavailable. Please try again later.");
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback` });
      if (error) throw error;
      notify("If your account exists, a recovery email is on its way. Update your password in Settings after signing in.", false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Recovery email could not be sent. Please retry.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  return (
    <main className="auth-v3">
      <header className="auth-v3-brand"><BrandMark /></header>
      <section className="auth-v3-content" aria-label="Account access" aria-busy={Boolean(busy)}>
        <div className="auth-v3-heading">
          <h1>{signup ? "Create your account" : "Welcome back"}</h1>
          <p>{signup ? "Make room for your next project." : "Sign in to your Kova workspace."}</p>
        </div>
        <div className="auth-v3-tabs" role="tablist" aria-label="Authentication mode">
          {(["signin", "signup"] as const).map((mode) => (
            <button key={mode} type="button" role="tab" id={`auth-tab-${mode}`} aria-selected={authMode === mode} aria-controls="auth-access-panel" tabIndex={authMode === mode ? 0 : -1} disabled={Boolean(busy)} onClick={() => changeMode(mode)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "signin" : event.key === "End" ? "signup" : mode === "signin" ? "signup" : "signin";
              changeMode(next);
              document.getElementById(`auth-tab-${next}`)?.focus();
            }}>{mode === "signin" ? "Sign in" : "Create account"}</button>
          ))}
        </div>
        <div id="auth-access-panel" role="tabpanel" aria-labelledby={`auth-tab-${authMode}`}>
          <form onSubmit={submit} noValidate>
            <fieldset disabled={Boolean(busy)} className="auth-v3-fields">
              <fieldset className="auth-v3-intent" aria-describedby="auth-intent-hint">
                <legend>Workspace</legend>
                <div className="auth-v3-intent-options">
                  {(["individual", "organisation"] as const).map((value) => (
                    <label key={value}>
                      <input type="radio" name="workspace-intent" value={value} checked={intent === value} onChange={() => { setIntent(value); setMessage(""); }} />
                      {value === "individual" ? <UserRound aria-hidden="true" /> : <Building2 aria-hidden="true" />}
                      <span>{value === "individual" ? "Individual" : "Organisation"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p id="auth-intent-hint" className="auth-v3-hint">{intent === "organisation"
                ? signup ? "Use your Kova account to set up an organisation after email verification." : "Use your Kova account to access an organisation you belong to."
                : "Your personal workspace, with the same account for your teams."}</p>
              {signup && intent === "organisation" && <label className="auth-v3-field"><span>Organisation name</span><input id="auth-organisation" autoComplete="organization" value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} required maxLength={80} /></label>}
              <button className="auth-v3-google" type="button" disabled={!configured} onClick={signInWithGoogle}>
                {busy === "google" ? <LoaderCircle className="auth-v3-spin" aria-hidden="true" /> : (
                  // Official Google-hosted raster asset; no reconstructed logo.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="" width={20} height={20} />
                )}
                {busy === "google" ? "Connecting to Google..." : "Continue with Google"}
              </button>
              <div className="auth-v3-divider"><span>or use email</span></div>
              {signup && <label className="auth-v3-field"><span>Full name</span><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></label>}
              <label className="auth-v3-field"><span>Work email</span><input type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} /></label>
              <label className="auth-v3-field"><span>Password</span><input type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={signup ? 8 : undefined} aria-describedby={signup ? "auth-password-hint" : undefined} /></label>
              {signup && <><p id="auth-password-hint" className="auth-v3-password-hint">At least 8 characters.</p><label className="auth-v3-field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required minLength={8} /></label></>}
              {!signup && <button type="button" className="auth-v3-recovery" disabled={!configured} onClick={recover}>{busy === "recovery" ? "Sending recovery email..." : "Forgot password?"}</button>}
              <p id="auth-feedback" className="auth-v3-feedback" data-error={isError} role="status" aria-live="polite" aria-atomic="true">{message}</p>
              <button type="submit" className="auth-v3-submit" disabled={!configured}>
                {busy === "email" ? <LoaderCircle className="auth-v3-spin" aria-hidden="true" /> : null}
                {busy === "email" ? signup ? "Creating account..." : "Signing in..." : signup ? "Create account" : "Continue to Kova"}
                {!busy && <ArrowRight aria-hidden="true" />}
              </button>
            </fieldset>
          </form>
        </div>
        <p className="auth-v3-security"><LockKeyhole aria-hidden="true" />{configured ? "Your private workspace" : "Authentication unavailable. Please try again later."}</p>
      </section>
      <footer className="auth-v3-footer">Kova. A place for work to take shape.</footer>
    </main>
  );
}
