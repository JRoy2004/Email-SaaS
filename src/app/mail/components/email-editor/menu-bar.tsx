import React from "react";
import { type Editor } from "@tiptap/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
} from "@fortawesome/free-solid-svg-icons";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  CornerDownLeft,
  Undo,
  Redo,
} from "lucide-react";

type Props = {
  editor: Editor;
};

const EditorMenuBar = ({ editor }: Props) => {
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40];
  const fontFamilies = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ];

  const headingIcons = [Heading1, Heading2, Heading3, Heading4];
  if (!editor) return null;
  return (
    <div className="button-group flex flex-wrap gap-2">
      <select
        onChange={(e) =>
          editor.chain().focus().setFontFamily(e.target.value).run()
        }
        defaultValue="Arial"
      >
        <option disabled value="">
          Font Family
        </option>
        {fontFamilies.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        onChange={(e) =>
          editor.chain().focus().setFontSize(e.target.value).run()
        }
        defaultValue="12px"
      >
        <option disabled value="">
          Font Size
        </option>
        {fontSizes.map((size) => (
          <option key={size} value={`${size}px`}>
            {size}px
          </option>
        ))}
      </select>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`button-icon ${editor.isActive("bold") ? "is-active" : ""}`}
        title="Bold"
      >
        <Bold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`button-icon ${
          editor.isActive("italic") ? "is-active" : ""
        }`}
        title="Italic"
      >
        <Italic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`button-icon ${
          editor.isActive("strike") ? "is-active" : ""
        }`}
        title="Strike"
      >
        <Strikethrough />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`button-icon ${editor.isActive("code") ? "is-active" : ""}`}
        title="Code"
      >
        <Code />
      </button>

      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`button-icon ${
          editor.isActive("paragraph") ? "is-active" : ""
        }`}
        title="Paragraph"
      >
        <Pilcrow />
      </button>

      <button
        className="button-icon"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <FontAwesomeIcon icon={faAlignLeft} />
      </button>
      <button
        className="button-icon"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <FontAwesomeIcon icon={faAlignCenter} />
      </button>
      <button
        className="button-icon"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <FontAwesomeIcon icon={faAlignRight} />
      </button>

      {headingIcons.map((Icon, index) => {
        const level = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        return (
          <button
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className={`button-icon ${
              editor.isActive("heading", { level }) ? "is-active" : ""
            }`}
            title={`Heading ${level}`}
          >
            <Icon />
          </button>
        );
      })}

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`button-icon ${
          editor.isActive("bulletList") ? "is-active" : ""
        }`}
        title="Bullet List"
      >
        <List />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`button-icon ${
          editor.isActive("orderedList") ? "is-active" : ""
        }`}
        title="Ordered List"
      >
        <ListOrdered />
      </button>

      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="button-icon"
        title="Horizontal Rule"
      >
        ━━━
      </button>
      <button
        className="button-icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </button>
      <button
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
      >
        Clear
      </button>
      <button
        onClick={() => editor.chain().focus().setHardBreak().run()}
        className="button-icon"
        title="Hard Break"
      >
        <CornerDownLeft />
      </button>

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="button-icon"
        title="Undo"
      >
        <Undo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="button-icon"
        title="Redo"
      >
        <Redo />
      </button>
    </div>
  );
};

export default EditorMenuBar;
