import React, { useState, useEffect } from "react";
import { BookOpen, FileText, ChevronRight, Search, FolderOpen } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  description: string;
  pubDatetime: string | null;
  draft: boolean;
  featured: boolean;
  tags: string[];
  series?: string;
  category?: string;
}

interface SeriesGroup {
  name: string;
  posts: Post[];
}

interface CategoryGroup {
  name: string;
  series: SeriesGroup[];
}

export default function SeriesList() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [noSeries, setNoSeries] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/posts")
      .then(r => r.json())
      .then((posts: Post[]) => {
        const catMap = new Map<string, Map<string, Post[]>>();
        const none: Post[] = [];

        for (const p of posts) {
          if (!p.series) {
            none.push(p);
            continue;
          }
          const catName = p.category || "Tech";
          if (!catMap.has(catName)) catMap.set(catName, new Map());
          const seriesMap = catMap.get(catName)!;
          if (!seriesMap.has(p.series)) seriesMap.set(p.series, []);
          seriesMap.get(p.series)!.push(p);
        }

        const sorted: CategoryGroup[] = [...catMap.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, seriesMap]) => ({
            name,
            series: [...seriesMap.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([sName, sPosts]) => ({ name: sName, posts: sPosts })),
          }));

        setCategories(sorted);
        setNoSeries(none);
        setLoading(false);
        if (sorted.length > 0) setExpandedCat(sorted[0].name);
      });
  }, []);

  const filteredCategories = query
    ? categories.map(cat => ({
        ...cat,
        series: cat.series.filter(
          s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.posts.some(p => p.title.toLowerCase().includes(query.toLowerCase()))
        ),
      })).filter(cat => cat.series.length > 0)
    : categories;

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "";

  if (loading) return <div className="list-loading" style={{ paddingTop: 64 }}>불러오는 중…</div>;

  const seriesKey = (catName: string, seriesName: string) => `${catName}::${seriesName}`;

  return (
    <div className="series-list">
      <div className="post-list-header">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input placeholder="시리즈 검색" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {filteredCategories.length === 0 && !query ? (
        <div className="list-empty">
          <BookOpen size={32} />
          <p>아직 시리즈가 없습니다. 글 편집 시 메타 설정에서 시리즈를 지정하세요.</p>
        </div>
      ) : (
        <div className="series-groups">
          {filteredCategories.map(cat => (
            <div key={cat.name} className="series-group">
              {/* 대분류 헤더 */}
              <button
                className={`series-group-header ${expandedCat === cat.name ? "open" : ""}`}
                onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
              >
                <div className="series-group-info">
                  <FolderOpen size={15} />
                  <span className="series-name" style={{ fontWeight: 600 }}>{cat.name}</span>
                  <span className="series-count">
                    {cat.series.reduce((n, s) => n + s.posts.length, 0)}편
                  </span>
                </div>
                <ChevronRight size={15} className={`series-chevron ${expandedCat === cat.name ? "rotated" : ""}`} />
              </button>

              {/* 중분류 목록 */}
              {expandedCat === cat.name && (
                <div style={{ paddingLeft: "16px" }}>
                  {cat.series.map(s => {
                    const key = seriesKey(cat.name, s.name);
                    return (
                      <div key={s.name} className="series-group">
                        <button
                          className={`series-group-header ${expandedSeries === key ? "open" : ""}`}
                          onClick={() => setExpandedSeries(expandedSeries === key ? null : key)}
                          style={{ paddingLeft: "8px" }}
                        >
                          <div className="series-group-info">
                            <BookOpen size={13} />
                            <span className="series-name">{s.name}</span>
                            <span className="series-count">{s.posts.length}편</span>
                          </div>
                          <ChevronRight size={13} className={`series-chevron ${expandedSeries === key ? "rotated" : ""}`} />
                        </button>

                        {expandedSeries === key && (
                          <ul className="series-posts">
                            {s.posts.map((p, i) => (
                              <li key={p.slug} className="series-post-item">
                                <span className="series-post-num">{i + 1}</span>
                                <a href={`/admin/edit/${p.slug}`} className="series-post-title">
                                  {p.title || "제목 없음"}
                                  {p.draft && <span className="draft-badge">초안</span>}
                                </a>
                                <span className="series-post-date">{fmt(p.pubDatetime)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {noSeries.length > 0 && !query && (
            <div className="series-group">
              <button
                className={`series-group-header ${expandedCat === "__none" ? "open" : ""}`}
                onClick={() => setExpandedCat(expandedCat === "__none" ? null : "__none")}
              >
                <div className="series-group-info">
                  <FileText size={15} />
                  <span className="series-name" style={{ color: "#aaa" }}>분류 없음</span>
                  <span className="series-count">{noSeries.length}편</span>
                </div>
                <ChevronRight size={15} className={`series-chevron ${expandedCat === "__none" ? "rotated" : ""}`} />
              </button>
              {expandedCat === "__none" && (
                <ul className="series-posts">
                  {noSeries.map(p => (
                    <li key={p.slug} className="series-post-item">
                      <span className="series-post-num">—</span>
                      <a href={`/admin/edit/${p.slug}`} className="series-post-title">{p.title || "제목 없음"}</a>
                      <span className="series-post-date">{fmt(p.pubDatetime)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
