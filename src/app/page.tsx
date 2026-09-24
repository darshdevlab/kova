import { AuthScreen } from "@/components/auth-screen";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthScreen
      initialError={
        params.auth_error
          ? "Sign-in was cancelled or expired. Please try again."
          : ""
      }
    />
  );
}
