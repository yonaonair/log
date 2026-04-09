import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts";
import { slugifyStr } from "./slugify";

const getPostsBySeries = (
  posts: CollectionEntry<"blog">[],
  category: string,
  series: string
) =>
  getSortedPosts(
    posts.filter(post => {
      if (!post.data.series) return false;
      const catName = post.data.category ?? "Tech";
      return (
        slugifyStr(catName) === category &&
        slugifyStr(post.data.series) === series
      );
    })
  );

export default getPostsBySeries;
