import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

interface Series {
  series: string;
  seriesName: string;
}

const getUniqueSeries = (posts: CollectionEntry<"blog">[]): Series[] => {
  const map = new Map<string, string>();

  posts.filter(postFilter).forEach(post => {
    const name = post.data.series;
    if (!name) return;
    const slug = slugifyStr(name);
    if (!map.has(slug)) map.set(slug, name);
  });

  return Array.from(map.entries())
    .map(([series, seriesName]) => ({ series, seriesName }))
    .sort((a, b) => a.series.localeCompare(b.series));
};

export default getUniqueSeries;
