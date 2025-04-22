import { Mark, mergeAttributes } from "@tiptap/core";

export interface FontFamilyOptions {
  types: string[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (font: string) => ReturnType;
    };
  }
}

export const FontFamily = Mark.create<FontFamilyOptions>({
  name: "fontFamily",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.style.fontFamily.replace(/['"]/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return {
            style: `font-family: ${attributes.style}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-family",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (font) =>
        ({ commands }) => {
          return commands.setMark("fontFamily", { style: font });
        },
    };
  },
});
