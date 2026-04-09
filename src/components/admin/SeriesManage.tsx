import React, { useState, useEffect } from "react";
import { BookOpen, FolderOpen, Pencil, Check, X, Loader2 } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  series?: string;
  category?: string;
  draft: boolean;
}

interface SeriesGroup {
  name: string;
  category: string;
  posts: Post[];
}

interface CategoryGroup {
  name: string;
  series: SeriesGroup[];
}

export default function SeriesManage() {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [saving, setSaving] = useState(false);

  const loadGroups = () => {
    fetch("/api/admin/posts")
      .then(r => r.json())
      .then((posts: Post[]) => {
        const catMap = new Map<string, Map<string, Post[]>>();
        for (const p of posts) {
          if (!p.series) continue;
          const catName = p.category || "Tech";
          if (!catMap.has(catName)) catMap.set(catName, new Map());
          const seriesMap = catMap.get(catName)!;
          if (!seriesMap.has(p.series)) seriesMap.set(p.series, []);
          seriesMap.get(p.series)!.push(p);
        }
        const groups: CategoryGroup[] = [...catMap.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([catName, seriesMap]) => ({
            name: catName,
            series: [...seriesMap.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([sName, sPosts]) => ({ name: sName, category: catName, posts: sPosts })),
          }));
        setCategoryGroups(groups);
        setLoading(false);
      });
  };

  useEffect(() => { loadGroups(); }, []);

  const renameKey = (catName: string, seriesName: string) => `${catName}::${seriesName}`;

  const handleRename = async (catName: string, oldName: string) => {
    if (!renameVal.trim() || renameVal === oldName) { setRenaming(null); return; }
    setSaving(true);
    const cat = categoryGroups.find(c => c.name === catName);
    const group = cat?.series.find(s => s.name === oldName);
    if (!group) return;

    await Promise.all(group.posts.map(async p => {
      const res = await fetch(`/api/admin/posts/${p.slug}`);
      const { frontmatter, content } = await res.json();
      await fetch(`/api/admin/posts/${p.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...frontmatter, series: renameVal.trim(), content, newSlug: p.slug }),
      });
    }));

    setSaving(false);
    setRenaming(null);
    loadGroups();
  };

  const handleRemoveSeries = async (catName: string, seriesName: string) => {
    if (!confirm(`"${seriesName}" 시리즈를 삭제할까요? (글은 삭제되지 않습니다)`)) return;
    setSaving(true);
    const cat = categoryGroups.find(c => c.name === catName);
    const group = cat?.series.find(s => s.name === seriesName);
    if (!group) return;

    await Promise.all(group.posts.map(async p => {
      const res = await fetch(`/api/admin/posts/${p.slug}`);
      const { frontmatter, content } = await res.json();
      const { series: _, ...rest } = frontmatter;
      await fetch(`/api/admin/posts/${p.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, content, newSlug: p.slug }),
      });
    }));

    setSaving(false);
    loadGroups();
  };

  if (loading) return <div className="list-loading" style={{ paddingTop: 64 }}>불러오는 중…</div>;

  if (categoryGroups.length === 0) return (
    <div className="list-empty" style={{ paddingTop: 64 }}>
      <BookOpen size={32} />
      <p>시리즈가 없습니다. 글 편집 → 메타 설정에서 시리즈를 지정하세요.</p>
    </div>
  );

  return (
    <div className="series-manage">
      {saving && <div className="saving-overlay"><Loader2 size={20} className="spin" /> 저장 중…</div>}

      {categoryGroups.map(cat => (
        <div key={cat.name} style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", opacity: 0.7, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <FolderOpen size={13} />
            {cat.name}
          </div>
          <table className="series-table">
            <thead>
              <tr>
                <th>시리즈명</th>
                <th>글 수</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {cat.series.map(g => (
                <tr key={g.name}>
                  <td>
                    {renaming === renameKey(cat.name, g.name) ? (
                      <div className="rename-row">
                        <input
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRename(cat.name, g.name);
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          autoFocus
                        />
                        <button className="icon-btn-sm" onClick={() => handleRename(cat.name, g.name)}><Check size={14} /></button>
                        <button className="icon-btn-sm" onClick={() => setRenaming(null)}><X size={14} /></button>
                      </div>
                    ) : (
                      <span className="series-name-cell">
                        <BookOpen size={13} />
                        {g.name}
                      </span>
                    )}
                  </td>
                  <td><span className="series-count">{g.posts.length}편</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="icon-btn-sm"
                        title="이름 변경"
                        onClick={() => { setRenaming(renameKey(cat.name, g.name)); setRenameVal(g.name); }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="icon-btn-sm danger"
                        title="시리즈 삭제 (글 유지)"
                        onClick={() => handleRemoveSeries(cat.name, g.name)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
