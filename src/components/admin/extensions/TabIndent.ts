import { Extension } from "@tiptap/core";

export const TabIndent = Extension.create({
  name: "tabIndent",

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        // Only intercept when: in list item, cursor at start of its content, no selection
        if (!empty) return false;
        if (!editor.isActive("listItem")) return false;
        if ($from.parentOffset !== 0) return false;

        // Lift the list item: if nested → go up one level; if top-level → convert to paragraph
        // This removes the bullet/number symbol without merging text into the previous item
        return editor.commands.liftListItem("listItem");
      },
      Tab: ({ editor }) => {
        // Inside table cell → let Table extension handle (go to next cell)
        if (editor.isActive("tableCell") || editor.isActive("tableHeader")) {
          return false;
        }
        // Inside list → indent (always consume the event to prevent focus escape)
        if (editor.isActive("listItem")) {
          editor.commands.sinkListItem("listItem");
          return true;
        }
        // Otherwise → 4 spaces
        return editor.commands.insertContent("    ");
      },
      "Shift-Tab": ({ editor }) => {
        // Inside table cell → let Table extension handle (go to prev cell)
        if (editor.isActive("tableCell") || editor.isActive("tableHeader")) {
          return false;
        }
        if (editor.isActive("listItem")) {
          editor.commands.liftListItem("listItem");
          return true;
        }
        return true;
      },
    };
  },
});
