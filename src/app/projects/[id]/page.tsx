import { Platform } from "@/components/platform/platform";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Platform itemId={id} />;
}
