import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts";
import { slugifyStr } from "./slugify";

const getPostsBySeries = (posts: CollectionEntry<"blog">[], series: string) =>
  getSortedPosts(
    posts.filter(
      post => post.data.series && slugifyStr(post.data.series) === series
    )
  );

export default getPostsBySeries;
