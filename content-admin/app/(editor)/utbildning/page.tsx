import { UtbildningClient } from "@/components/utbildning-client";

type SearchParams = Promise<{ slug?: string }>;

export default async function UtbildningPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { slug } = await searchParams;
  return <UtbildningClient initialSlug={slug ?? null} />;
}
