import React, { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";

type Tab = "site" | "home" | "socials";

const SOCIAL_PLATFORMS = ["GitHub", "X", "LinkedIn", "Mail", "Facebook", "Telegram", "WhatsApp", "Pinterest"];

interface SiteConfig {
  website: string; author: string; profile: string; desc: string; title: string;
  postPerIndex: number; postPerPage: number; showArchives: boolean; showAbout: boolean; showBackButton: boolean;
  lang: string; timezone: string;
}
interface Paragraph { text: string; linkText: string; linkHref: string; }
interface HomeConfig { heroTitle: string; paragraphs: Paragraph[]; }
interface SocialItem { name: string; href: string; active: boolean; }

function useSave<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(endpoint).then(r => r.json()).then(setData).catch(() => {});
  }, [endpoint]);

  const save = async (payload: T) => {
    setSaving(true);
    try {
      await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setData(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, save, saving, saved };
}

function SaveBtn({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button type="submit" className="btn-publish" disabled={saving} style={{ minWidth: 90 }}>
      {saving ? <Loader2 size={14} className="spin" /> : saved ? "저장됨 ✓" : <><Save size={14} style={{ marginRight: 6 }} />저장</>}
    </button>
  );
}

function SiteTab() {
  const { data, save, saving, saved } = useSave<SiteConfig>("/api/admin/config/site");
  const [form, setForm] = useState<SiteConfig | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (!form) return <div className="settings-loading">불러오는 중...</div>;

  const set = (k: keyof SiteConfig, v: string | boolean | number) =>
    setForm(f => f ? { ...f, [k]: v } : f);

  return (
    <form onSubmit={e => { e.preventDefault(); save(form!); }}>
      <div className="settings-grid">
        <Field label="사이트 제목"><input value={form.title} onChange={e => set("title", e.target.value)} /></Field>
        <Field label="설명"><input value={form.desc} onChange={e => set("desc", e.target.value)} /></Field>
        <Field label="작성자"><input value={form.author} onChange={e => set("author", e.target.value)} /></Field>
        <Field label="프로필 URL"><input value={form.profile} onChange={e => set("profile", e.target.value)} /></Field>
        <Field label="사이트 URL"><input value={form.website} onChange={e => set("website", e.target.value)} /></Field>
        <Field label="언어 코드"><input value={form.lang} onChange={e => set("lang", e.target.value)} placeholder="en" /></Field>
        <Field label="타임존"><input value={form.timezone} onChange={e => set("timezone", e.target.value)} placeholder="Asia/Seoul" /></Field>
        <Field label="인덱스 포스트 수"><input type="number" min={1} value={form.postPerIndex} onChange={e => set("postPerIndex", parseInt(e.target.value))} /></Field>
        <Field label="페이지당 포스트 수"><input type="number" min={1} value={form.postPerPage} onChange={e => set("postPerPage", parseInt(e.target.value))} /></Field>
        <Field label="아카이브 표시"><Toggle checked={form.showArchives} onChange={v => set("showArchives", v)} /></Field>
        <Field label="소개 페이지 표시"><Toggle checked={form.showAbout} onChange={v => set("showAbout", v)} /></Field>
        <Field label="뒤로가기 버튼"><Toggle checked={form.showBackButton} onChange={v => set("showBackButton", v)} /></Field>
      </div>
      <div className="settings-actions"><SaveBtn saving={saving} saved={saved} /></div>
    </form>
  );
}

function HomeTab() {
  const { data, save, saving, saved } = useSave<HomeConfig>("/api/admin/config/home");
  const [form, setForm] = useState<HomeConfig | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (!form) return <div className="settings-loading">불러오는 중...</div>;

  const updateParagraph = (i: number, patch: Partial<Paragraph>) =>
    setForm(f => f ? { ...f, paragraphs: f.paragraphs.map((p, idx) => idx === i ? { ...p, ...patch } : p) } : f);
  const addParagraph = () =>
    setForm(f => f ? { ...f, paragraphs: [...f.paragraphs, { text: "", linkText: "", linkHref: "" }] } : f);
  const removeParagraph = (i: number) =>
    setForm(f => f ? { ...f, paragraphs: f.paragraphs.filter((_, idx) => idx !== i) } : f);

  return (
    <form onSubmit={e => { e.preventDefault(); save(form!); }}>
      <div className="settings-grid">
        <Field label="히어로 제목" full>
          <input value={form.heroTitle} onChange={e => setForm(f => f ? { ...f, heroTitle: e.target.value } : f)} />
        </Field>
      </div>

      <div className="home-paragraphs">
        <div className="settings-label" style={{ marginBottom: 8 }}>단락</div>
        {form.paragraphs.map((p, i) => (
          <div key={i} className="home-paragraph-block">
            <div className="home-paragraph-header">
              <span className="home-paragraph-num">단락 {i + 1}</span>
              <button type="button" className="icon-btn-sm danger" onClick={() => removeParagraph(i)}>
                <Trash2 size={13} />
              </button>
            </div>
            <div className="settings-grid" style={{ marginBottom: 0 }}>
              <Field label="텍스트" full>
                <textarea rows={2} value={p.text} onChange={e => updateParagraph(i, { text: e.target.value })} />
              </Field>
              <Field label="링크 텍스트">
                <input placeholder="없으면 비워두세요" value={p.linkText} onChange={e => updateParagraph(i, { linkText: e.target.value })} />
              </Field>
              <Field label="링크 URL">
                <input placeholder="없으면 비워두세요" value={p.linkHref} onChange={e => updateParagraph(i, { linkHref: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add-social" onClick={addParagraph}>
          <Plus size={14} /> 단락 추가
        </button>
      </div>

      <div className="settings-actions"><SaveBtn saving={saving} saved={saved} /></div>
    </form>
  );
}

function SocialsTab() {
  const { data, save, saving, saved } = useSave<SocialItem[]>("/api/admin/config/socials");
  const [items, setItems] = useState<SocialItem[]>([]);
  useEffect(() => { if (data) setItems(data); }, [data]);
  if (!data) return <div className="settings-loading">불러오는 중...</div>;

  const update = (i: number, patch: Partial<SocialItem>) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  const remove = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const add = () => setItems(prev => [...prev, { name: "GitHub", href: "", active: true }]);

  return (
    <form onSubmit={e => { e.preventDefault(); save(items); }}>
      <div className="socials-list">
        {items.map((item, i) => (
          <div key={i} className="social-row">
            <select value={item.name} onChange={e => update(i, { name: e.target.value })}>
              {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              placeholder="URL"
              value={item.href}
              onChange={e => update(i, { href: e.target.value })}
              style={{ flex: 1 }}
            />
            <label className="social-toggle">
              <input type="checkbox" checked={item.active} onChange={e => update(i, { active: e.target.checked })} />
              <span>활성</span>
            </label>
            <button type="button" className="icon-btn-sm danger" onClick={() => remove(i)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" className="btn-add-social" onClick={add}>
          <Plus size={14} /> 소셜 추가
        </button>
      </div>
      <div className="settings-actions"><SaveBtn saving={saving} saved={saved} /></div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`settings-field${full ? " full" : ""}`}>
      <label className="settings-label">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </label>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "site", label: "기본 정보" },
  { id: "home", label: "홈 페이지" },
  { id: "socials", label: "소셜 링크" },
];

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>("site");
  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`settings-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="settings-body">
        {tab === "site" && <SiteTab />}
        {tab === "home" && <HomeTab />}
        {tab === "socials" && <SocialsTab />}
      </div>
    </div>
  );
}
