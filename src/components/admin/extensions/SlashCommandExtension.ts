import { Extension } from "@tiptap/core";
import { Suggestion } from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor) => void;
};

export const getSlashCommands = (): SlashCommandItem[] => [
  { title: "제목 1", description: "큰 제목", icon: "H1", command: ed => ed.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "제목 2", description: "중간 제목", icon: "H2", command: ed => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "제목 3", description: "작은 제목", icon: "H3", command: ed => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "불릿 목록", description: "순서 없는 목록", icon: "•", command: ed => ed.chain().focus().toggleBulletList().run() },
  { title: "번호 목록", description: "순서 있는 목록", icon: "1.", command: ed => ed.chain().focus().toggleOrderedList().run() },
  { title: "인용구", description: "블록 인용문", icon: "❝", command: ed => ed.chain().focus().toggleBlockquote().run() },
  { title: "코드 블록", description: "신택스 하이라이트", icon: "</>", command: ed => ed.chain().focus().toggleCodeBlock().run() },
  { title: "인라인 코드", description: "` 코드 스타일", icon: "`", command: ed => ed.chain().focus().toggleCode().run() },
  { title: "구분선", description: "가로 구분선", icon: "—", command: ed => ed.chain().focus().setHorizontalRule().run() },
  {
    title: "테이블", description: "3×3 표 삽입", icon: "▦",
    command: ed => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "콜아웃 (파랑)", description: "파란 배경 박스", icon: "🟦",
    command: ed => ed.chain().focus().insertContent({ type: "callout", attrs: { color: "blue" }, content: [{ type: "paragraph", content: [{ type: "text", text: "내용을 입력하세요" }] }] }).run(),
  },
  {
    title: "콜아웃 (초록)", description: "초록 배경 박스", icon: "🟩",
    command: ed => ed.chain().focus().insertContent({ type: "callout", attrs: { color: "green" }, content: [{ type: "paragraph", content: [{ type: "text", text: "내용을 입력하세요" }] }] }).run(),
  },
  {
    title: "콜아웃 (노랑)", description: "노란 배경 박스", icon: "🟨",
    command: ed => ed.chain().focus().insertContent({ type: "callout", attrs: { color: "yellow" }, content: [{ type: "paragraph", content: [{ type: "text", text: "내용을 입력하세요" }] }] }).run(),
  },
  {
    title: "콜아웃 (빨강)", description: "빨간 배경 박스", icon: "🟥",
    command: ed => ed.chain().focus().insertContent({ type: "callout", attrs: { color: "red" }, content: [{ type: "paragraph", content: [{ type: "text", text: "내용을 입력하세요" }] }] }).run(),
  },
  {
    title: "메시지 버블", description: "아이메시지 스타일", icon: "💬",
    command: ed => ed.chain().focus().insertContent({ type: "messageBubble", attrs: { side: "left", text: "메시지를 입력하세요" } }).run(),
  },
  {
    title: "북마크", description: "URL 북마크 카드", icon: "🔖",
    command: ed => {
      const url = prompt("URL을 입력하세요:");
      if (!url) return;
      fetch(`/api/admin/bookmark?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(data => ed.chain().focus().insertContent({ type: "bookmark", attrs: data }).run());
    },
  },
  {
    title: "주석", description: "텍스트에 각주 달기", icon: "※",
    command: ed => {
      const text = prompt("주석을 달 텍스트:");
      if (!text) return;
      const note = prompt("주석 내용:");
      if (!note) return;
      ed.chain().focus().insertContent({ type: "annotation", attrs: { text, note } }).run();
    },
  },
  {
    title: "위키링크", description: "[[다른 글 제목]]", icon: "🔗",
    command: ed => {
      const title = prompt("링크할 글 제목:");
      if (!title) return;
      ed.chain().focus().insertContent({ type: "wikiLink", attrs: { title } }).run();
    },
  },
];

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
