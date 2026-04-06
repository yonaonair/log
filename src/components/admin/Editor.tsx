import React, { useState, useRef, useCallback, useEffect } from "react";
import DatePicker from "./DatePicker";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { CharacterCount } from "@tiptap/extension-character-count";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import TableToolbar from "./TableToolbar";
import { MessageBubble } from "./extensions/MessageBubble";
import { Bookmark } from "./extensions/Bookmark";
import { Callout } from "./extensions/Callout";
import { YellowHighlightRule } from "./extensions/YellowHighlightRule";
import {
  SlashCommands,
  getSlashCommands,
  type SlashCommandItem,
} from "./extensions/SlashCommandExtension";
import { Annotation } from "./extensions/Annotation";
import { WikiLink } from "./extensions/WikiLink";
import { TabIndent } from "./extensions/TabIndent";
import type { Editor as TiptapEditor } from "@tiptap/core";

// ─── Local types ─────────────────────────────────────────────────────────────
interface SlashRenderProps {
  items: SlashCommandItem[];
  range: { from: number; to: number };
  command: (item: SlashCommandItem) => void;
}
interface SlashCommandArg {
  editor: TiptapEditor;
  range: { from: number; to: number };
  props: SlashCommandItem;
}
type MarkdownStorage = { markdown?: { getMarkdown?: () => string } };
type CharCountStorage = { characterCount?: { words?: () => number } };
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Highlighter,
  Quote,
  Check,
  X,
  ArrowLeft,
  Settings,
  Upload,
  Loader2,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Terminal,
  Minus,
  Table2,
  MessageSquare,
  BookMarked,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

const lowlight = createLowlight(common);

export interface PostMeta {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  featured: boolean;
  draft: boolean;
  pubDatetime: string;
  author: string;
  series: string;
}

interface Props {
  initialContent?: string;
  initialMeta?: Partial<PostMeta>;
  isNew?: boolean;
  onBack?: () => void;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Custom Floating Bubble Menu ──────────────────────────────────────────────
function FloatingBubbleMenu({ editor }: { editor: TiptapEditor }) {
  const [state, setState] = useState<{
    visible: boolean;
    top: number;
    left: number;
  }>({
    visible: false,
    top: 0,
    left: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to || editor.isActive("image")) {
        setState(s => ({ ...s, visible: false }));
        return;
      }
      const view = editor.view;
      const startCoords = view.coordsAtPos(from);
      const endCoords = view.coordsAtPos(to);
      const midX = (startCoords.left + endCoords.left) / 2;
      setState({ visible: true, top: startCoords.top - 52, left: midX });
    };

    editor.on("selectionUpdate", update);
    editor.on("blur", () => setState(s => ({ ...s, visible: false })));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  if (!editor || !state.visible) return null;

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      style={{
        position: "fixed",
        top: state.top,
        left: state.left,
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <button
        className={`bm-btn ${editor.isActive("bold") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon size={14} />
      </button>
      <button
        className={`bm-btn ${editor.isActive("italic") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon size={14} />
      </button>
      <button
        className={`bm-btn ${editor.isActive("underline") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={14} />
      </button>
      <button
        className={`bm-btn ${editor.isActive("strike") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </button>
      <div className="bm-divider" />
      <button
        className={`bm-btn ${editor.isActive("highlight") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="노란 강조"
      >
        <Highlighter size={14} />
      </button>
      <button
        className={`bm-btn ${editor.isActive("code") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} />
      </button>
      <button
        className={`bm-btn ${editor.isActive("link") ? "active" : ""}`}
        onClick={() => {
          const url = prompt("URL:", editor.getAttributes("link").href ?? "");
          if (url === null) return;
          if (!url) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon size={14} />
      </button>
    </div>
  );
}

// ─── Slash Command Menu ───────────────────────────────────────────────────────
function SlashMenu({
  items,
  selectedIndex,
  onSelect,
}: {
  items: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (item: SlashCommandItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className="slash-menu" ref={listRef}>
      {items.map((item, i) => (
        <button
          key={item.title}
          className={`slash-item ${i === selectedIndex ? "slash-item-active" : ""}`}
          onMouseDown={e => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          <span className="slash-icon">{item.icon}</span>
          <span className="slash-label">
            <span className="slash-title">{item.title}</span>
            <span className="slash-desc">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function Editor({
  initialContent = "",
  initialMeta,
  isNew = false,
  onBack,
}: Props) {
  const [meta, setMeta] = useState<PostMeta>({
    title: initialMeta?.title ?? "",
    slug: initialMeta?.slug ?? "",
    description: initialMeta?.description ?? "",
    tags: initialMeta?.tags ?? [],
    featured: initialMeta?.featured ?? false,
    draft: initialMeta?.draft ?? true,
    pubDatetime: initialMeta?.pubDatetime ?? new Date().toISOString(),
    author: initialMeta?.author ?? "",
    series: initialMeta?.series ?? "",
  });
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [tagInput, setTagInput] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [slashState, setSlashState] = useState<{
    show: boolean;
    items: SlashCommandItem[];
    index: number;
    range: { from: number; to: number } | null;
  }>({ show: false, items: [], index: 0, range: null });
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "pending" | "saved"
  >("idle");

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showMore, setShowMore] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const slashSelectRef = useRef<((item: SlashCommandItem) => void) | null>(
    null
  );
  const slashIndexRef = useRef(0);
  const slashItemsRef = useRef<SlashCommandItem[]>([]);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close overflow panel when clicking outside
  useEffect(() => {
    if (!showMore) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setShowMore(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMore]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "제목을 입력하세요";
          return "글을 작성하거나 '/'를 입력해 블록을 삽입하세요…";
        },
      }),
      Typography,
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false }),
      Image,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      TextStyle,
      CharacterCount,
      Markdown.configure({ html: true, tightLists: true }),
      MessageBubble,
      Bookmark,
      Callout,
      Annotation,
      WikiLink,
      TabIndent,
      YellowHighlightRule,
      SlashCommands.configure({
        suggestion: {
          char: "/",
          items: ({ query }: { query: string }) => {
            const all = getSlashCommands();
            return query
              ? all.filter(i =>
                  i.title.toLowerCase().includes(query.toLowerCase())
                )
              : all;
          },
          render: () => {
            return {
              onStart: (props: SlashRenderProps) => {
                slashIndexRef.current = 0;
                slashItemsRef.current = props.items;
                slashSelectRef.current = (item: SlashCommandItem) =>
                  props.command(item);
                setSlashState({
                  show: true,
                  items: props.items,
                  index: 0,
                  range: props.range,
                });
              },
              onUpdate: (props: SlashRenderProps) => {
                slashIndexRef.current = 0;
                slashItemsRef.current = props.items;
                slashSelectRef.current = (item: SlashCommandItem) =>
                  props.command(item);
                setSlashState(s => ({
                  ...s,
                  items: props.items,
                  range: props.range,
                  index: 0,
                }));
              },
              onExit: () => {
                slashSelectRef.current = null;
                setSlashState(s => ({ ...s, show: false }));
              },
              onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === "ArrowDown") {
                  const newIdx =
                    (slashIndexRef.current + 1) % slashItemsRef.current.length;
                  slashIndexRef.current = newIdx;
                  setSlashState(s => ({ ...s, index: newIdx }));
                  return true;
                }
                if (event.key === "ArrowUp") {
                  const newIdx =
                    (slashIndexRef.current - 1 + slashItemsRef.current.length) %
                    slashItemsRef.current.length;
                  slashIndexRef.current = newIdx;
                  setSlashState(s => ({ ...s, index: newIdx }));
                  return true;
                }
                if (event.key === "Enter") {
                  const item = slashItemsRef.current[slashIndexRef.current];
                  if (item && slashSelectRef.current)
                    slashSelectRef.current(item);
                  return true;
                }
                if (event.key === "Escape") {
                  setSlashState(s => ({ ...s, show: false }));
                  return true;
                }
                return false;
              },
            };
          },
          command: ({ editor: ed, range, props }: SlashCommandArg) => {
            ed.chain().focus().deleteRange(range).run();
            props.command(ed);
            setSlashState(s => ({ ...s, show: false }));
          },
        },
      }),
    ],
    content: initialContent || undefined,
    editorProps: {
      attributes: { class: "prose-editor", spellcheck: "false" },
    },
  });

  // auto-slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMeta(m => ({
      ...m,
      title: val,
      slug: slugEdited ? m.slug : slugify(val),
    }));
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const save = useCallback(
    async (publish = false) => {
      if (!editor) return;
      setSaveState("saving");
      const content =
        (editor.storage as MarkdownStorage).markdown?.getMarkdown?.() ??
        editor.getText();
      const payload = {
        ...meta,
        draft: publish ? false : meta.draft,
        content,
        newSlug: meta.slug,
      };
      try {
        const url = isNew
          ? "/api/admin/posts"
          : `/api/admin/posts/${initialMeta?.slug ?? meta.slug}`;
        const method = isNew ? "POST" : "PUT";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        if (publish) setMeta(m => ({ ...m, draft: false }));
        setSaveState("saved");
        const toastMsg = isNew
          ? "글이 저장됐어요. 편집 페이지로 이동합니다."
          : publish
          ? (meta.draft ? "발행됐어요!" : "업데이트됐어요!")
          : "저장됐어요!";
        setToast({ msg: toastMsg, type: "success" });
        if (isNew) {
          setTimeout(() => { window.location.href = `/admin/edit/${meta.slug}`; }, 1500);
        } else {
          setTimeout(() => { setSaveState("idle"); setToast(null); }, 3000);
        }
      } catch {
        setSaveState("error");
        setToast({ msg: "저장에 실패했어요. 다시 시도해주세요.", type: "error" });
        setTimeout(() => { setSaveState("idle"); setToast(null); }, 4000);
      }
    },
    [editor, meta, isNew, initialMeta?.slug]
  );

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url as string;
  }, []);

  // Auto-save (draft only, every 30s of inactivity)
  useEffect(() => {
    if (!editor || isNew) return;
    const handler = () => {
      setAutoSaveStatus("pending");
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        const content =
          (editor.storage as MarkdownStorage).markdown?.getMarkdown?.() ??
          editor.getText();
        const payload = { ...meta, content, newSlug: meta.slug };
        const res = await fetch(
          `/api/admin/posts/${initialMeta?.slug ?? meta.slug}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }
      }, 30000);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      clearTimeout(autoSaveTimer.current);
    };
  }, [editor, meta, isNew, initialMeta?.slug]);

  // Paste URL → bookmark
  useEffect(() => {
    if (!editor) return;
    const handlePaste = async (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const text =
        clipboardEvent.clipboardData?.getData("text/plain")?.trim() ?? "";
      if (
        !/^https?:\/\//i.test(text) ||
        text.includes(" ") ||
        text.includes("\n")
      )
        return;
      const { from, to } = editor.state.selection;
      if (from !== to) return;
      e.preventDefault();
      const res = await fetch(
        `/api/admin/bookmark?url=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      editor
        .chain()
        .focus()
        .insertContent({ type: "bookmark", attrs: data })
        .run();
    };
    editor.view.dom.addEventListener("paste", handlePaste);
    return () => editor.view.dom.removeEventListener("paste", handlePaste);
  }, [editor]);

  // 태그 특정부분 삭제
  const removeTag = (tagToRemove: string) => {
    setMeta(m => ({
      ...m,
      tags: m.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (t && !meta.tags.includes(t))
      setMeta(m => ({ ...m, tags: [...m.tags, t] }));
    setTagInput("");
  };

  const wordCount =
    (editor?.storage as CharCountStorage)?.characterCount?.words?.() ?? 0;

  return (
    <div
      className="admin-editor"
      onDrop={e => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file?.type.startsWith("image/")) return;
        uploadImage(file).then(url =>
          editor?.chain().focus().setImage({ src: url }).run()
        );
      }}
      onDragOver={e => e.preventDefault()}
    >
      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`editor-toast editor-toast--${toast.type}`}>
          {toast.type === "success" ? <Check size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="editor-header">
        <div className="editor-header-left">
          <button
            className="icon-btn"
            onClick={onBack ?? (() => window.history.back())}
            title="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="editor-status">
            {saveState === "saving" && (
              <>
                <Loader2 size={14} className="spin" /> 저장 중
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check size={14} /> 저장됨
              </>
            )}
            {saveState === "error" && (
              <>
                <X size={14} /> 오류
              </>
            )}
            {saveState === "idle" && autoSaveStatus === "pending" && (
              <span style={{ color: "#bbb" }}>편집 중…</span>
            )}
            {saveState === "idle" && autoSaveStatus === "saved" && (
              <>
                <Check size={14} style={{ color: "#bbb" }} /> 자동저장
              </>
            )}
          </span>
          <span className={`editor-mode-badge ${isNew ? "editor-mode-badge--new" : ""}`}>
            {isNew ? "새 글" : (meta.slug || "편집 중")}
          </span>
        </div>

        <div className="editor-header-toolbar" ref={moreRef}>
          {/* ── Primary buttons (always visible) ── */}
          {[
            {
              key: "bold",
              icon: <BoldIcon size={15} />,
              cmd: () => editor?.chain().focus().toggleBold().run(),
              title: "굵게",
            },
            {
              key: "italic",
              icon: <ItalicIcon size={15} />,
              cmd: () => editor?.chain().focus().toggleItalic().run(),
              title: "기울임",
            },
            {
              key: "underline",
              icon: <UnderlineIcon size={15} />,
              cmd: () => editor?.chain().focus().toggleUnderline().run(),
              title: "밑줄",
            },
            {
              key: "strike",
              icon: <Strikethrough size={15} />,
              cmd: () => editor?.chain().focus().toggleStrike().run(),
              title: "취소선",
            },
          ].map(({ key, icon, cmd, title }) => (
            <button
              key={key}
              className={`toolbar-btn ${editor?.isActive(key) ? "active" : ""}`}
              onMouseDown={e => {
                e.preventDefault();
                cmd();
              }}
              title={title}
            >
              {icon}
            </button>
          ))}
          <div className="toolbar-divider" />
          {[
            {
              key: "code",
              icon: <Code size={15} />,
              cmd: () => editor?.chain().focus().toggleCode().run(),
              title: "인라인 코드",
            },
            {
              key: "highlight",
              icon: <Highlighter size={15} />,
              cmd: () => editor?.chain().focus().toggleHighlight().run(),
              title: "노란 강조",
            },
            {
              key: "link",
              icon: <LinkIcon size={15} />,
              cmd: () => {
                const url = prompt(
                  "URL:",
                  editor?.getAttributes("link").href ?? ""
                );
                if (url === null) return;
                if (!url) {
                  editor?.chain().focus().unsetLink().run();
                  return;
                }
                editor?.chain().focus().setLink({ href: url }).run();
              },
              title: "링크",
            },
          ].map(({ key, icon, cmd, title }) => (
            <button
              key={key}
              className={`toolbar-btn ${editor?.isActive(key) ? "active" : ""}`}
              onMouseDown={e => {
                e.preventDefault();
                cmd();
              }}
              title={title}
            >
              {icon}
            </button>
          ))}
          <div className="toolbar-divider" />
          <label
            className="toolbar-btn"
            title="이미지 업로드"
            style={{ cursor: "pointer" }}
          >
            <Upload size={15} />
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                editor?.chain().focus().setImage({ src: url }).run();
              }}
            />
          </label>
          <div className="toolbar-divider" />

          {/* ── More button ── */}
          <button
            className={`toolbar-btn toolbar-more-btn ${showMore ? "active" : ""}`}
            onMouseDown={e => {
              e.preventDefault();
              setShowMore(s => !s);
            }}
            title="더 보기"
          >
            <ChevronDown
              size={15}
              style={{
                transform: showMore ? "rotate(180deg)" : "none",
                transition: "transform .15s",
              }}
            />
          </button>

          {/* ── Overflow dropdown ── */}
          {showMore && (
            <div className="toolbar-overflow">
              <div className="toolbar-overflow-group">
                <span className="toolbar-overflow-label">제목</span>
                <div className="toolbar-overflow-row">
                  {([1, 2, 3] as const).map((level, i) => {
                    const HeadIcon = [Heading1, Heading2, Heading3][i];
                    return (
                      <button
                        key={`h${level}`}
                        className={`toolbar-btn ${editor?.isActive("heading", { level }) ? "active" : ""}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level })
                            .run();
                          setShowMore(false);
                        }}
                        title={`제목 ${level}`}
                      >
                        <HeadIcon size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="toolbar-overflow-group">
                <span className="toolbar-overflow-label">목록 / 인용</span>
                <div className="toolbar-overflow-row">
                  <button
                    className={`toolbar-btn ${editor?.isActive("bulletList") ? "active" : ""}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().toggleBulletList().run();
                      setShowMore(false);
                    }}
                    title="불릿 목록"
                  >
                    <List size={15} />
                  </button>
                  <button
                    className={`toolbar-btn ${editor?.isActive("orderedList") ? "active" : ""}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().toggleOrderedList().run();
                      setShowMore(false);
                    }}
                    title="번호 목록"
                  >
                    <ListOrdered size={15} />
                  </button>
                  <button
                    className={`toolbar-btn ${editor?.isActive("blockquote") ? "active" : ""}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().toggleBlockquote().run();
                      setShowMore(false);
                    }}
                    title="인용구"
                  >
                    <Quote size={15} />
                  </button>
                </div>
              </div>
              <div className="toolbar-overflow-group">
                <span className="toolbar-overflow-label">블록</span>
                <div className="toolbar-overflow-row">
                  <button
                    className={`toolbar-btn ${editor?.isActive("codeBlock") ? "active" : ""}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().toggleCodeBlock().run();
                      setShowMore(false);
                    }}
                    title="코드 블록"
                  >
                    <Terminal size={15} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().setHorizontalRule().run();
                      setShowMore(false);
                    }}
                    title="구분선"
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    className={`toolbar-btn ${editor?.isActive("table") ? "active" : ""}`}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run();
                      setShowMore(false);
                    }}
                    title="테이블 삽입"
                  >
                    <Table2 size={15} />
                  </button>
                </div>
              </div>
              <div className="toolbar-overflow-group">
                <span className="toolbar-overflow-label">콜아웃</span>
                <div className="toolbar-overflow-row">
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: "callout",
                          attrs: { color: "blue" },
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                { type: "text", text: "내용을 입력하세요" },
                              ],
                            },
                          ],
                        })
                        .run();
                      setShowMore(false);
                    }}
                    title="파랑"
                  >
                    <Info size={15} style={{ color: "#3b82f6" }} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: "callout",
                          attrs: { color: "green" },
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                { type: "text", text: "내용을 입력하세요" },
                              ],
                            },
                          ],
                        })
                        .run();
                      setShowMore(false);
                    }}
                    title="초록"
                  >
                    <Lightbulb size={15} style={{ color: "#22c55e" }} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: "callout",
                          attrs: { color: "yellow" },
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                { type: "text", text: "내용을 입력하세요" },
                              ],
                            },
                          ],
                        })
                        .run();
                      setShowMore(false);
                    }}
                    title="노랑"
                  >
                    <AlertTriangle size={15} style={{ color: "#eab308" }} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: "callout",
                          attrs: { color: "red" },
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                { type: "text", text: "내용을 입력하세요" },
                              ],
                            },
                          ],
                        })
                        .run();
                      setShowMore(false);
                    }}
                    title="빨강"
                  >
                    <AlertOctagon size={15} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              </div>
              <div className="toolbar-overflow-group">
                <span className="toolbar-overflow-label">특수</span>
                <div className="toolbar-overflow-row">
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({
                          type: "messageBubble",
                          attrs: { side: "left", text: "메시지를 입력하세요" },
                        })
                        .run();
                      setShowMore(false);
                    }}
                    title="메시지 버블"
                  >
                    <MessageSquare size={15} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={async e => {
                      e.preventDefault();
                      setShowMore(false);
                      const url = prompt("URL을 입력하세요:");
                      if (!url) return;
                      const res = await fetch(
                        `/api/admin/bookmark?url=${encodeURIComponent(url)}`
                      );
                      const data = await res.json();
                      editor
                        ?.chain()
                        .focus()
                        .insertContent({ type: "bookmark", attrs: data })
                        .run();
                    }}
                    title="북마크 카드"
                  >
                    <BookMarked size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="editor-header-right">
          <span className="word-count">{wordCount} 단어</span>
          <button
            className="icon-btn"
            onClick={() => setShowMeta(s => !s)}
            title="메타 설정"
          >
            <Settings size={18} />
          </button>
          <button
            className="btn-save"
            onClick={() => save(false)}
            disabled={saveState === "saving"}
          >
            저장
          </button>
          <button
            className="btn-publish"
            onClick={() => save(true)}
            disabled={saveState === "saving"}
          >
            {meta.draft ? "발행" : "업데이트"}
          </button>
        </div>
      </header>

      {/* ── Meta Drawer ──────────────────────────────────────── */}

      {showMeta && (
        <div
          className="meta-drawer"
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="meta-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {/* 슬러그 */}
            <div
              className="meta-field"
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>
                슬러그
              </label>
              <input
                value={meta.slug}
                onChange={e => {
                  setMeta(m => ({ ...m, slug: e.target.value }));
                  setSlugEdited(true);
                }}
                spellCheck={false}
                style={inputStyle}
              />
            </div>

            {/* 작성일 */}
            <div
              className="meta-field"
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>
                작성일
              </label>
              <DatePicker
                value={meta.pubDatetime}
                onChange={iso => setMeta(m => ({ ...m, pubDatetime: iso }))}
              />
            </div>

            {/* 설명 */}
            <div
              className="meta-field"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>설명</label>
              <input
                value={meta.description}
                onChange={e =>
                  setMeta(m => ({ ...m, description: e.target.value }))
                }
                placeholder="검색 결과와 OG 카드에 표시됩니다"
                style={inputStyle}
              />
            </div>

            {/* 태그 영역 */}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>태그</label>

              {/* 태그 리스트 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {meta.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      borderRadius: "999px",
                      fontSize: "13px",
                      gap: "6px",
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        fontSize: "14px",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* 태그 입력 */}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="태그 입력 후 Enter"
                style={inputStyle}
              />
            </div>

            {/* 시리즈 */}
            <div
              className="meta-field"
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>
                시리즈
              </label>
              <input
                value={meta.series}
                onChange={e => setMeta(m => ({ ...m, series: e.target.value }))}
                placeholder="시리즈명 (선택)"
                style={inputStyle}
              />
            </div>

            {/* 작성자 */}
            <div
              className="meta-field"
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: "#6b7280" }}>
                작성자
              </label>
              <input
                value={meta.author}
                onChange={e => setMeta(m => ({ ...m, author: e.target.value }))}
                placeholder="기본값 사용"
                style={inputStyle}
              />
            </div>
            {/* 토글 */}
            <div
              className="meta-field meta-toggles"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                gap: "16px",
                marginTop: "12px",
              }}
            >
              {/* 추천 글 */}
              <label style={toggleCardStyle}>
                <span>추천 글</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={meta.featured}
                    onChange={e =>
                      setMeta(m => ({ ...m, featured: e.target.checked }))
                    }
                  />
                  <span className="slider"></span>
                </div>
              </label>

              {/* 초안 */}
              <label style={toggleCardStyle}>
                <span>초안</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={meta.draft}
                    onChange={e =>
                      setMeta(m => ({ ...m, draft: e.target.checked }))
                    }
                  />
                  <span className="slider" />
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Document ─────────────────────────────────────────── */}
      <main className="editor-main">
        <div className="editor-document">
          <textarea
            ref={titleRef}
            className="title-input"
            placeholder="제목을 입력하세요"
            value={meta.title}
            onChange={handleTitleChange}
            rows={1}
          />
          {meta.slug && <div className="slug-preview">/{meta.slug}</div>}
          <input
            className="subtitle-input"
            placeholder="한 줄 소개"
            value={meta.description}
            onChange={e =>
              setMeta(m => ({ ...m, description: e.target.value }))
            }
          />

          <div className="editor-body">
            {slashState.show && slashState.items.length > 0 && (
              <SlashMenu
                items={slashState.items}
                selectedIndex={slashState.index}
                onSelect={item => {
                  if (!editor || !slashState.range) return;
                  editor.chain().focus().deleteRange(slashState.range).run();
                  item.command(editor);
                  setSlashState(s => ({ ...s, show: false }));
                }}
              />
            )}
            {editor && <FloatingBubbleMenu editor={editor} />}
            {editor && <TableToolbar editor={editor} />}
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </div>
  );
}

// 공통 input 스타일
const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
};

const toggleCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  minWidth: "140px",
  cursor: "pointer",
  fontSize: "14px",
  color: "#374151",
  background: "#fafafa",
};
