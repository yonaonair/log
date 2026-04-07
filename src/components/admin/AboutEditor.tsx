import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Typography } from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import { CheckCircle2, Eye, FileCode2, Loader2, Save } from "lucide-react";

const markdownGuide = `# About

간단한 소개 문장을 여기에 적어보세요.

## 핵심 링크

- [GitHub](https://github.com/)
- [Portfolio](https://example.com/)

> 마크다운 문법을 그대로 입력하면 오른쪽 미리보기에 바로 반영됩니다.
`;

export default function AboutEditor() {
  const [frontmatter, setFrontmatter] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const deferredBody = useDeferredValue(body);

  const previewEditor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit,
      Typography,
      Link.configure({ openOnClick: true }),
      Markdown.configure({ html: true, tightLists: true, transformPastedText: true }),
    ],
    editorProps: {
      attributes: {
        class: "app-prose prose-editor about-preview-editor",
      },
    },
  });

  useEffect(() => {
    let active = true;

    fetch("/api/admin/config/about")
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        setFrontmatter(data.frontmatter ?? "");
        setBody(data.body ?? "");
      })
      .catch(() => {
        if (!active) return;
        setBody("");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!previewEditor) return;
    previewEditor.commands.setContent(deferredBody || " ");
  }, [deferredBody, previewEditor]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await fetch("/api/admin/config/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter, body }),
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const trimmed = body.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = body ? body.split(/\r?\n/).length : 0;

    return { words, lines };
  }, [body]);

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "linear-gradient(180deg, rgba(247,248,250,0.96) 0%, rgba(255,255,255,1) 28%, rgba(244,247,251,0.92) 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "32px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <section
          style={{
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: 28,
            padding: "24px 24px 20px",
            background:
              "radial-gradient(circle at top left, rgba(0,108,172,0.12), transparent 36%), #ffffff",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(0,108,172,0.08)",
                  color: "#00598d",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <FileCode2 size={14} />
                Markdown-first editor
              </div>
              <h1
                style={{
                  margin: "16px 0 8px",
                  fontSize: "clamp(1.75rem, 3vw, 2.6rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                소개 페이지를 마크다운 그대로 편집
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                왼쪽에는 원문을 그대로 입력하고, 오른쪽에서 실제 렌더링 결과를 바로 확인할 수 있게 구성했습니다.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {stats.words} words
                </span>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {stats.lines} lines
                </span>
              </div>

              <button
                className="btn-publish"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  minWidth: 132,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    저장 중
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 size={15} />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
            }}
          >
            <div
              style={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 24,
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileCode2 size={16} color="#0f766e" />
                  <strong style={{ color: "#0f172a", fontSize: 15 }}>
                    본문 Markdown
                  </strong>
                </div>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  문법을 그대로 입력하세요
                </span>
              </div>

              <textarea
                value={body}
                onChange={e => {
                  const nextValue = e.target.value;
                  startTransition(() => setBody(nextValue));
                }}
                placeholder={markdownGuide}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 560,
                  padding: 20,
                  border: "none",
                  resize: "vertical",
                  outline: "none",
                  fontSize: 15,
                  lineHeight: 1.8,
                  background: "#fff",
                  color: "#0f172a",
                  fontFamily:
                    "var(--font-orbit), 'SFMono-Regular', Consolas, monospace",
                }}
              />
            </div>

            <div
              style={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 24,
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <strong style={{ color: "#0f172a", fontSize: 15 }}>
                  Frontmatter
                </strong>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  비워두면 기존 구조만 유지됩니다
                </span>
              </div>

              <textarea
                value={frontmatter}
                onChange={e => setFrontmatter(e.target.value)}
                placeholder={"title: About\nlayout: page"}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 160,
                  padding: 18,
                  border: "none",
                  resize: "vertical",
                  outline: "none",
                  fontSize: 14,
                  lineHeight: 1.7,
                  background: "#fffcf5",
                  color: "#334155",
                  fontFamily:
                    "var(--font-orbit), 'SFMono-Regular', Consolas, monospace",
                }}
              />
            </div>
          </section>

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
            }}
          >
            <div
              style={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 24,
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
                minHeight: 300,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  borderBottom: "1px solid #e2e8f0",
                  background:
                    "linear-gradient(90deg, rgba(15,118,110,0.08), rgba(255,255,255,1))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Eye size={16} color="#0f766e" />
                  <strong style={{ color: "#0f172a", fontSize: 15 }}>
                    실시간 미리보기
                  </strong>
                </div>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  실제 렌더 결과 확인
                </span>
              </div>

              <div style={{ padding: 20 }}>
                {loading ? (
                  <div
                    style={{
                      minHeight: 240,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      gap: 10,
                    }}
                  >
                    <Loader2 size={16} className="spin" />
                    불러오는 중
                  </div>
                ) : (
                  <EditorContent editor={previewEditor} />
                )}
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 24,
                padding: 18,
                background: "#0f172a",
                color: "#e2e8f0",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
              }}
            >
              <strong style={{ display: "block", marginBottom: 12, fontSize: 15 }}>
                빠른 팁
              </strong>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "grid",
                  gap: 8,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#cbd5e1",
                }}
              >
                <li>`#`, `##`로 제목을 만들 수 있습니다.</li>
                <li>빈 줄을 넣어야 문단이 자연스럽게 분리됩니다.</li>
                <li>링크와 리스트는 원문 그대로 유지되고 오른쪽에서 바로 확인됩니다.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
