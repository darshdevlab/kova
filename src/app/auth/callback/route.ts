import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const failure = () =>
    NextResponse.redirect(new URL("/?auth_error=callback", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !url || !key || request.nextUrl.searchParams.has("error"))
    return failure();

  const response = NextResponse.redirect(
    new URL("/auth/complete", request.url),
  );
  response.headers.set("Cache-Control", "no-store");
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies)
          response.cookies.set(name, value, options);
      },
    },
  });
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? failure() : response;
  } catch {
    return failure();
  }
}
