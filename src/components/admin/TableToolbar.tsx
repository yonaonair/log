import React, { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Trash2, Merge, Split, Grid2x2, TableProperties,
} from "lucide-react";

interface Props {
  editor: Editor;
}

export default function TableToolbar({ editor }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [canMerge, setCanMerge] = useState(false);
  const [canSplit, setCanSplit] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!editor.isActive("table")) {
        setVisible(false);
        return;
      }

      // Find the table DOM element
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.getBoundingClientRect();

      // Position toolbar at top-left of editor area, anchored above selection
      setPos({
        top: coords.top - 44,
        left: editorRect.left,
      });

      setCanMerge(editor.can().mergeCells());
      setCanSplit(editor.can().splitCell());
      setVisible(true);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!visible) return null;

  const btn = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    disabled = false,
    danger = false
  ) => (
    <button
      className={`tbl-btn ${disabled ? "tbl-btn-disabled" : ""} ${danger ? "tbl-btn-danger" : ""}`}
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
      title={label}
      disabled={disabled}
    >
      {icon}
    </button>
  );

  return (
    <div
      ref={toolbarRef}
      className="table-toolbar"
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 90 }}
    >
      {/* Row */}
      <div className="tbl-group">
        <span className="tbl-group-label">행</span>
        {btn(() => editor.chain().focus().addRowBefore().run(), <ArrowUp size={13} />, "위에 행 추가")}
        {btn(() => editor.chain().focus().addRowAfter().run(), <ArrowDown size={13} />, "아래에 행 추가")}
        {btn(() => editor.chain().focus().deleteRow().run(), <Trash2 size={13} />, "행 삭제", false, true)}
      </div>

      <div className="tbl-divider" />

      {/* Column */}
      <div className="tbl-group">
        <span className="tbl-group-label">열</span>
        {btn(() => editor.chain().focus().addColumnBefore().run(), <ArrowLeft size={13} />, "왼쪽에 열 추가")}
        {btn(() => editor.chain().focus().addColumnAfter().run(), <ArrowRight size={13} />, "오른쪽에 열 추가")}
        {btn(() => editor.chain().focus().deleteColumn().run(), <Trash2 size={13} />, "열 삭제", false, true)}
      </div>

      <div className="tbl-divider" />

      {/* Cell */}
      <div className="tbl-group">
        <span className="tbl-group-label">셀</span>
        {btn(
          () => editor.chain().focus().mergeCells().run(),
          <Merge size={13} />,
          "셀 병합 (드래그 후)",
          !canMerge
        )}
        {btn(
          () => editor.chain().focus().splitCell().run(),
          <Split size={13} />,
          "셀 분리",
          !canSplit
        )}
        {btn(
          () => editor.chain().focus().toggleHeaderRow().run(),
          <TableProperties size={13} />,
          "헤더 행 토글"
        )}
        {btn(
          () => editor.chain().focus().toggleHeaderColumn().run(),
          <Grid2x2 size={13} />,
          "헤더 열 토글"
        )}
      </div>

      <div className="tbl-divider" />

      {/* Delete table */}
      {btn(
        () => editor.chain().focus().deleteTable().run(),
        <><Trash2 size={13} /><span style={{ fontSize: 11, marginLeft: 3 }}>표 삭제</span></>,
        "표 전체 삭제",
        false,
        true
      )}
    </div>
  );
}
