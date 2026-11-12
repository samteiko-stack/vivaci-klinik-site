import { BloggClient } from "@/components/blogg-client";

type SearchParams = Promise<{ slug?: string }>;

export default async function BloggPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { slug } = await searchParams;
  return <BloggClient initialSlug={slug ?? null} />;
}
