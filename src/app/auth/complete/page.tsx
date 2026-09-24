"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { writeSession } from "@/lib/storage";

export default function CompleteSignIn() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    async function complete() {
      try {
        const client = getSupabaseBrowserClient();
        if (!client) throw new Error("Authentication unavailable");
        const { data, error } = await client.auth.getUser();
        if (error || !data.user?.email) throw new Error("No verified session");
        if (!active) return;
        writeSession({
          email: data.user.email,
          name:
            data.user.user_metadata.full_name || data.user.email.split("@")[0],
          mode: "supabase",
        });
        router.replace("/projects");
      } catch {
        if (active) setFailed(true);
      }
    }
    void complete();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main style={{ maxWidth: 440, margin: "80px auto", padding: 24 }}>
      <h1>{failed ? "Sign-in could not be completed" : "Signing you in"}</h1>
      <p role="status">
        {failed
          ? "Your session could not be verified. Please try again."
          : "Verifying your Kova account..."}
      </p>
      {failed && (
        <Link className="button primary" href="/">
          Return to sign in
        </Link>
      )}
    </main>
  );
}
