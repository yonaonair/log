import React, { useState, useEffect } from "react";
import { BookOpen, FileText, ChevronRight, Search } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  description: string;
  pubDatetime: string | null;
  draft: boolean;
  featured: boolean;
  tags: string[];
  series?: string;
}

interface SeriesGroup {
  name: string;
  posts: Post[];
}

export default function SeriesList() {
  const [groups, setGroups] = useState<SeriesGroup[]>([]);
  const [noSeries, setNoSeries] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/posts")
      .then(r => r.json())
      .then((posts: Post[]) => {
        const map = new Map<string, Post[]>();
        const none: Post[] = [];
        for (const p of posts) {
          if (p.series) {
            if (!map.has(p.series)) map.set(p.series, []);
            map.get(p.series)!.push(p);
          } else {
            none.push(p);
          }
        }
        const sorted = [...map.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, posts]) => ({ name, posts }));
        setGroups(sorted);
        setNoSeries(none);
        setLoading(false);
        if (sorted.length > 0) setExpanded(sorted[0].name);
      });
  }, []);

  const filteredGroups = query
    ? groups.filter(g => g.name.toLowerCase().includes(query.toLowerCase()) || g.posts.some(p => p.title.toLowerCase().includes(query.toLowerCase())))
    : groups;

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "";

  if (loading) return <div className="list-loading" style={{paddingTop:64}}>불러오는 중…</div>;

  return (
    <div className="series-list">
      <div className="post-list-header">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input placeholder="시리즈 검색" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {filteredGroups.length === 0 && !query ? (
        <div className="list-empty">
          <BookOpen size={32} />
          <p>아직 시리즈가 없습니다. 글 편집 시 메타 설정에서 시리즈를 지정하세요.</p>
        </div>
      ) : (
        <div className="series-groups">
          {filteredGroups.map(g => (
            <div key={g.name} className="series-group">
              <button className={`series-group-header ${expanded === g.name ? "open" : ""}`} onClick={() => setExpanded(expanded === g.name ? null : g.name)}>
                <div className="series-group-info">
                  <BookOpen size={15} />
                  <span className="series-name">{g.name}</span>
                  <span className="series-count">{g.posts.length}편</span>
                </div>
                <ChevronRight size={15} className={`series-chevron ${expanded === g.name ? "rotated" : ""}`} />
              </button>
              {expanded === g.name && (
                <ul className="series-posts">
                  {g.posts.map((p, i) => (
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
          ))}

          {noSeries.length > 0 && !query && (
            <div className="series-group">
              <button className={`series-group-header ${expanded === "__none" ? "open" : ""}`} onClick={() => setExpanded(expanded === "__none" ? null : "__none")}>
                <div className="series-group-info">
                  <FileText size={15} />
                  <span className="series-name" style={{color:"#aaa"}}>시리즈 미지정</span>
                  <span className="series-count">{noSeries.length}편</span>
                </div>
                <ChevronRight size={15} className={`series-chevron ${expanded === "__none" ? "rotated" : ""}`} />
              </button>
              {expanded === "__none" && (
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
