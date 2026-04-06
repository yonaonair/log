import React, { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

export default function AboutEditor() {
  const [frontmatter, setFrontmatter] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config/about")
      .then(r => r.json())
      .then(d => { setFrontmatter(d.frontmatter); setBody(d.body); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/config/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter, body }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="about-editor">
      <div className="about-editor-note">
        마크다운 형식으로 작성하세요. 저장 후 1~2분 내에 블로그에 반영됩니다.
      </div>
      <textarea
        className="about-editor-textarea"
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="About 페이지 내용을 마크다운으로 입력하세요..."
        rows={24}
        spellCheck={false}
      />
      <div className="settings-actions">
        <button className="btn-publish" onClick={handleSave} disabled={saving} style={{ minWidth: 90 }}>
          {saving ? <Loader2 size={14} className="spin" /> : saved ? "저장됨 ✓" : <><Save size={14} style={{ marginRight: 6 }} />저장</>}
        </button>
      </div>
    </div>
  );
}
