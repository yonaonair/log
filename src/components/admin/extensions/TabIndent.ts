import { Extension } from "@tiptap/core";

export const TabIndent = Extension.create({
  name: "tabIndent",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive("listItem")) {
          return editor.commands.sinkListItem("listItem");
        }
        return editor.commands.insertContent("    ");
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("listItem")) {
          return editor.commands.liftListItem("listItem");
        }
        return true;
      },
    };
  },
});
