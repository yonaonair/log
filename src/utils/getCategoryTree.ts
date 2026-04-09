import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

export interface SeriesNode {
  series: string;
  seriesName: string;
  count: number;
}

export interface CategoryNode {
  category: string;
  categoryName: string;
  seriesNodes: SeriesNode[];
  totalPosts: number;
}

const getCategoryTree = (posts: CollectionEntry<"blog">[]): CategoryNode[] => {
  const catMap = new Map<
    string,
    { name: string; seriesMap: Map<string, { name: string; count: number }> }
  >();

  posts.filter(postFilter).forEach(post => {
    const seriesName = post.data.series;
    if (!seriesName) return;

    const categoryName = post.data.category ?? "Tech";
    const catSlug = slugifyStr(categoryName);
    const seriesSlug = slugifyStr(seriesName);

    if (!catMap.has(catSlug)) {
      catMap.set(catSlug, { name: categoryName, seriesMap: new Map() });
    }
    const cat = catMap.get(catSlug)!;
    if (!cat.seriesMap.has(seriesSlug)) {
      cat.seriesMap.set(seriesSlug, { name: seriesName, count: 0 });
    }
    cat.seriesMap.get(seriesSlug)!.count++;
  });

  return Array.from(catMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, { name: categoryName, seriesMap }]) => {
      const seriesNodes = Array.from(seriesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([series, { name: seriesName, count }]) => ({
          series,
          seriesName,
          count,
        }));
      return {
        category,
        categoryName,
        seriesNodes,
        totalPosts: seriesNodes.reduce((sum, s) => sum + s.count, 0),
      };
    });
};

export default getCategoryTree;
