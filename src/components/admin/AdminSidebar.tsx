import React, { useState, useEffect } from "react";
import {
  FileText, PenLine, Layers, Settings2, Plus, ChevronLeft, ChevronRight, ChevronDown, ExternalLink, LogOut,
} from "lucide-react";

interface Props {
  active?: "posts" | "drafts" | "series" | "series-manage";
}

export default function AdminSidebar({ active }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [seriesOpen, setSeriesOpen] = useState(active === "series" || active === "series-manage");
  const [seriesList, setSeriesList] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then(r => r.json())
      .then((posts: { series?: string }[]) => {
        const names = [...new Set(posts.map(p => p.series).filter(Boolean))] as string[];
        setSeriesList(names.sort());
      })
      .catch(() => {});
  }, []);

  const link = (href: string, icon: React.ReactNode, label: string, isActive: boolean) => (
    <a
      href={href}
      className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-link-icon">{icon}</span>
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
    </a>
  );

  return (
    <aside className={`admin-sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Logo + collapse toggle */}
      <div className="sidebar-top">
        {!collapsed && <div className="sidebar-logo">✦ Admin</div>}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-label">콘텐츠</div>}
        {link("/admin", <FileText size={15} />, "전체 글", active === "posts")}
        {link("/admin/drafts", <PenLine size={15} />, "임시저장", active === "drafts")}

        {/* Series section */}
        <div style={{ marginTop: collapsed ? 8 : 14 }}>
          {!collapsed && <div className="sidebar-section-label">시리즈</div>}
          <button
            className={`sidebar-link sidebar-link-btn ${(active === "series" || active === "series-manage") ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
            onClick={() => !collapsed && setSeriesOpen(o => !o)}
            title={collapsed ? "시리즈별 보기" : undefined}
          >
            <span className="sidebar-link-icon"><Layers size={15} /></span>
            {!collapsed && (
              <>
                <span className="sidebar-link-label">시리즈별 보기</span>
                <ChevronDown size={12} style={{ marginLeft: "auto", transform: seriesOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              </>
            )}
          </button>

          {/* Inline series list */}
          {!collapsed && seriesOpen && (
            <div className="sidebar-series-list">
              {seriesList.length === 0 ? (
                <span className="sidebar-series-empty">시리즈 없음</span>
              ) : seriesList.map(name => (
                <a
                  key={name}
                  href={`/admin/series`}
                  className="sidebar-series-item"
                >
                  {name}
                </a>
              ))}
              <a href="/admin/series/manage" className={`sidebar-series-manage ${active === "series-manage" ? "active" : ""}`}>
                <Settings2 size={12} />
                시리즈 관리
              </a>
            </div>
          )}
          {collapsed && (
            <a href="/admin/series/manage" className={`sidebar-link collapsed ${active === "series-manage" ? "active" : ""}`} title="시리즈 관리">
              <span className="sidebar-link-icon"><Settings2 size={15} /></span>
            </a>
          )}
        </div>
      </nav>

      <div className="sidebar-bottom">
        <a href="/admin/new" className={`sidebar-new-btn ${collapsed ? "collapsed" : ""}`} title="새 글 작성">
          <Plus size={14} />
          {!collapsed && "새 글 작성"}
        </a>
        <div className="sidebar-divider" />
        <a href="/" target="_blank" className={`sidebar-link ${collapsed ? "collapsed" : ""}`} title="블로그 보기">
          <span className="sidebar-link-icon"><ExternalLink size={15} /></span>
          {!collapsed && <span className="sidebar-link-label">블로그 보기</span>}
        </a>
        <button
          className={`sidebar-link logout-btn ${collapsed ? "collapsed" : ""}`}
          onClick={() => fetch("/api/admin/auth", { method: "DELETE" }).then(() => { location.href = "/admin/login"; })}
          title="로그아웃"
        >
          <span className="sidebar-link-icon"><LogOut size={15} /></span>
          {!collapsed && <span className="sidebar-link-label">로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
