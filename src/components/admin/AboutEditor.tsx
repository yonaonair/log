import { useState, useRef, useEffect } from "react";
import { Save, Loader2, Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon, Highlighter } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import { MessageBubble } from "./extensions/MessageBubble";
import { Callout } from "./extensions/Callout";
import { YellowHighlightRule } from "./extensions/YellowHighlightRule";
import {
  SlashCommands,
  getSlashCommands,
  type SlashCommandItem,
} from "./extensions/SlashCommandExtension";
import { WikiLink } from "./extensions/WikiLink";
import { TabIndent } from "./extensions/TabIndent";
import type { Editor as TiptapEditor } from "@tiptap/core";

const lowlight = createLowlight(common);
type MarkdownStorage = { markdown?: { getMarkdown?: () => string } };

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

function FloatingBubbleMenu({ editor }: { editor: TiptapEditor }) {
  const [state, setState] = useState({ visible: false, top: 0, left: 0 });
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
      style={{ position: "fixed", top: state.top, left: state.left, transform: "translateX(-50%)", zIndex: 100 }}
      onMouseDown={e => e.preventDefault()}
    >
      <button className={`bm-btn ${editor.isActive("bold") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()}><BoldIcon size={14} /></button>
      <button className={`bm-btn ${editor.isActive("italic") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()}><ItalicIcon size={14} /></button>
      <button className={`bm-btn ${editor.isActive("underline") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></button>
      <button className={`bm-btn ${editor.isActive("strike") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></button>
      <div className="bm-divider" />
      <button className={`bm-btn ${editor.isActive("highlight") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleHighlight().run()} title="노란 강조"><Highlighter size={14} /></button>
      <button className={`bm-btn ${editor.isActive("code") ? "active" : ""}`} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></button>
      <button
        className={`bm-btn ${editor.isActive("link") ? "active" : ""}`}
        onClick={() => {
          const url = prompt("URL:", editor.getAttributes("link").href ?? "");
          if (url === null) return;
          if (!url) { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().setLink({ href: url }).run();
        }}
      ><LinkIcon size={14} /></button>
    </div>
  );
}

function SlashMenu({ items, selectedIndex, onSelect }: { items: SlashCommandItem[]; selectedIndex: number; onSelect: (item: SlashCommandItem) => void }) {
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
          onMouseDown={e => { e.preventDefault(); onSelect(item); }}
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

export default function AboutEditor() {
  const [frontmatter, setFrontmatter] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slashState, setSlashState] = useState<{
    show: boolean;
    items: SlashCommandItem[];
    index: number;
    range: { from: number; to: number } | null;
  }>({ show: false, items: [], index: 0, range: null });

  const slashSelectRef = useRef<((item: SlashCommandItem) => void) | null>(null);
  const slashIndexRef = useRef(0);
  const slashItemsRef = useRef<SlashCommandItem[]>([]);

  const pendingBody = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({
        placeholder: "소개글을 작성하거나 '/'를 입력해 블록을 삽입하세요…",
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
      Markdown.configure({ html: true, tightLists: true }),
      MessageBubble,
      Callout,
      WikiLink,
      TabIndent,
      YellowHighlightRule,
      SlashCommands.configure({
        suggestion: {
          char: "/",
          items: ({ query }: { query: string }) => {
            const all = getSlashCommands();
            return query
              ? all.filter(i => i.title.toLowerCase().includes(query.toLowerCase()))
              : all;
          },
          render: () => ({
            onStart: (props: SlashRenderProps) => {
              slashIndexRef.current = 0;
              slashItemsRef.current = props.items;
              slashSelectRef.current = (item: SlashCommandItem) => props.command(item);
              setSlashState({ show: true, items: props.items, index: 0, range: props.range });
            },
            onUpdate: (props: SlashRenderProps) => {
              slashIndexRef.current = 0;
              slashItemsRef.current = props.items;
              slashSelectRef.current = (item: SlashCommandItem) => props.command(item);
              setSlashState(s => ({ ...s, items: props.items, range: props.range, index: 0 }));
            },
            onExit: () => {
              slashSelectRef.current = null;
              setSlashState(s => ({ ...s, show: false }));
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (event.key === "ArrowDown") {
                const newIdx = (slashIndexRef.current + 1) % slashItemsRef.current.length;
                slashIndexRef.current = newIdx;
                setSlashState(s => ({ ...s, index: newIdx }));
                return true;
              }
              if (event.key === "ArrowUp") {
                const newIdx = (slashIndexRef.current - 1 + slashItemsRef.current.length) % slashItemsRef.current.length;
                slashIndexRef.current = newIdx;
                setSlashState(s => ({ ...s, index: newIdx }));
                return true;
              }
              if (event.key === "Enter") {
                const item = slashItemsRef.current[slashIndexRef.current];
                if (item && slashSelectRef.current) slashSelectRef.current(item);
                return true;
              }
              if (event.key === "Escape") {
                setSlashState(s => ({ ...s, show: false }));
                return true;
              }
              return false;
            },
          }),
          command: ({ editor: ed, range, props }: SlashCommandArg) => {
            ed.chain().focus().deleteRange(range).run();
            props.command(ed);
            setSlashState(s => ({ ...s, show: false }));
          },
        },
      }),
    ],
    editorProps: {
      attributes: { class: "prose-editor", spellcheck: "false" },
    },
    onCreate: ({ editor: ed }) => {
      if (pendingBody.current !== null) {
        ed.commands.setContent(pendingBody.current);
        pendingBody.current = null;
      }
    },
  });

  useEffect(() => {
    fetch("/api/admin/config/about")
      .then(r => r.json())
      .then(d => {
        setFrontmatter(d.frontmatter ?? "");
        const body = d.body ?? "";
        if (editor) {
          editor.commands.setContent(body);
        } else {
          pendingBody.current = body;
        }
      })
      .catch(() => {});
  }, [editor]);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const body =
        (editor.storage as MarkdownStorage).markdown?.getMarkdown?.() ??
        editor.getText();
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
    <div className="editor-root">
      <div className="editor-topbar">
        <div className="editor-topbar-left" />
        <div className="editor-topbar-right">
          <button
            className="btn-publish"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 90 }}
          >
            {saving ? (
              <Loader2 size={14} className="spin" />
            ) : saved ? (
              "저장됨 ✓"
            ) : (
              <><Save size={14} style={{ marginRight: 6 }} />저장</>
            )}
          </button>
        </div>
      </div>
      <div className="editor-scroll">
        <div className="editor-inner">
          {editor && <FloatingBubbleMenu editor={editor} />}
          {slashState.show && slashState.items.length > 0 && (
            <SlashMenu
              items={slashState.items}
              selectedIndex={slashState.index}
              onSelect={item => {
                if (slashSelectRef.current) slashSelectRef.current(item);
              }}
            />
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
