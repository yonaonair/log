import React, { useState, useEffect } from "react";
import { FileText, Star, Eye, Trash2, Search, Loader2 } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  description: string;
  pubDatetime: string | null;
  draft: boolean;
  featured: boolean;
  tags: string[];
}

export default function PostList({ filterDraft }: { filterDraft?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); });
  }, []);

  const filtered = posts.filter(p => {
    if (filterDraft !== undefined && p.draft !== filterDraft) return false;
    return (
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.includes(query.toLowerCase()))
    );
  });

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`"${title}" 글을 삭제할까요?`)) return;
    setDeleting(slug);
    await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
    setPosts(p => p.filter(x => x.slug !== slug));
    setDeleting(null);
  };

  const fmt = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="post-list">
      <div className="post-list-header">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            placeholder="제목 또는 태그 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="list-loading"><Loader2 size={20} className="spin" /> 불러오는 중…</div>
      ) : filtered.length === 0 ? (
        <div className="list-empty">
          <FileText size={32} />
          <p>{query ? "검색 결과가 없습니다" : "글이 없습니다. 첫 번째 글을 작성해보세요!"}</p>
        </div>
      ) : (
        <ul className="post-items">
          {filtered.map(p => (
            <li key={p.slug} className="post-item">
              <a href={`/admin/edit/${p.slug}`} className="post-item-link">
                <div className="post-item-main">
                  <div className="post-item-title">
                    {p.featured && <Star size={12} className="featured-star" />}
                    <span>{p.title || "제목 없음"}</span>
                    {p.draft && <span className="draft-badge">초안</span>}
                  </div>
                  {p.description && <p className="post-item-desc">{p.description}</p>}
                  <div className="post-item-meta">
                    <span className="post-date">{fmt(p.pubDatetime)}</span>
                    {p.tags.map(t => (
                      <span key={t} className="post-tag">#{t}</span>
                    ))}
                  </div>
                </div>
              </a>
              <div className="post-item-actions">
                <a
                  href={`/posts/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn-sm"
                  title="미리보기"
                >
                  <Eye size={15} />
                </a>
                <button
                  className="icon-btn-sm danger"
                  title="삭제"
                  onClick={() => handleDelete(p.slug, p.title)}
                  disabled={deleting === p.slug}
                >
                  {deleting === p.slug ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
