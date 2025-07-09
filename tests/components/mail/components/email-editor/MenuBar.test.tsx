import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Editor } from "@tiptap/react";
import EditorMenuBar from "@/app/mail/components/email-editor/menu-bar";

// Mock FontAwesome icons
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon }: { icon: any }) => (
    <span data-testid={`fa-${icon.iconName}`} />
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Bold: () => <span data-testid="bold-icon" />,
  Italic: () => <span data-testid="italic-icon" />,
  Strikethrough: () => <span data-testid="strikethrough-icon" />,
  Code: () => <span data-testid="code-icon" />,
  Pilcrow: () => <span data-testid="pilcrow-icon" />,
  Heading1: () => <span data-testid="heading1-icon" />,
  Heading2: () => <span data-testid="heading2-icon" />,
  Heading3: () => <span data-testid="heading3-icon" />,
  Heading4: () => <span data-testid="heading4-icon" />,
  List: () => <span data-testid="list-icon" />,
  ListOrdered: () => <span data-testid="list-ordered-icon" />,
  Quote: () => <span data-testid="quote-icon" />,
  CornerDownLeft: () => <span data-testid="corner-down-left-icon" />,
  Undo: () => <span data-testid="undo-icon" />,
  Redo: () => <span data-testid="redo-icon" />,
}));

// Create a mock editor with all necessary methods
const createMockEditor = (overrides = {}): Editor => {
  const mockChain = {
    focus: jest.fn().mockReturnThis(),
    setFontFamily: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    toggleBold: jest.fn().mockReturnThis(),
    toggleItalic: jest.fn().mockReturnThis(),
    toggleStrike: jest.fn().mockReturnThis(),
    toggleCode: jest.fn().mockReturnThis(),
    setParagraph: jest.fn().mockReturnThis(),
    setTextAlign: jest.fn().mockReturnThis(),
    toggleHeading: jest.fn().mockReturnThis(),
    toggleBulletList: jest.fn().mockReturnThis(),
    toggleOrderedList: jest.fn().mockReturnThis(),
    setHorizontalRule: jest.fn().mockReturnThis(),
    toggleBlockquote: jest.fn().mockReturnThis(),
    unsetAllMarks: jest.fn().mockReturnThis(),
    clearNodes: jest.fn().mockReturnThis(),
    setHardBreak: jest.fn().mockReturnThis(),
    undo: jest.fn().mockReturnThis(),
    redo: jest.fn().mockReturnThis(),
    run: jest.fn(),
  };

  const mockCan = {
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: () => true }),
        toggleItalic: () => ({ run: () => true }),
        toggleStrike: () => ({ run: () => true }),
        toggleCode: () => ({ run: () => true }),
        undo: () => ({ run: () => true }),
        redo: () => ({ run: () => true }),
      }),
    }),
  };

  return {
    chain: () => mockChain,
    can: () => mockCan,
    isActive: jest.fn().mockReturnValue(false),
    ...overrides,
  } as unknown as Editor;
};

describe("EditorMenuBar", () => {
  let mockEditor: Editor;

  beforeEach(() => {
    mockEditor = createMockEditor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all font family options", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      const fontFamilySelect = screen.getByDisplayValue("Arial");
      expect(fontFamilySelect).toBeInTheDocument();

      const fontFamilies = [
        "Arial",
        "Times New Roman",
        "Courier New",
        "Georgia",
        "Verdana",
      ];
      fontFamilies.forEach((font) => {
        expect(screen.getByText(font)).toBeInTheDocument();
      });
    });

    it("should render all font size options", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40];
      fontSizes.forEach((size) => {
        expect(screen.getByText(`${size}px`)).toBeInTheDocument();
      });
    });

    it("should render all formatting buttons", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      expect(screen.getByTestId("bold-icon")).toBeInTheDocument();
      expect(screen.getByTestId("italic-icon")).toBeInTheDocument();
      expect(screen.getByTestId("strikethrough-icon")).toBeInTheDocument();
      expect(screen.getByTestId("code-icon")).toBeInTheDocument();
      expect(screen.getByTestId("pilcrow-icon")).toBeInTheDocument();
    });

    it("should render all heading buttons", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      expect(screen.getByTestId("heading1-icon")).toBeInTheDocument();
      expect(screen.getByTestId("heading2-icon")).toBeInTheDocument();
      expect(screen.getByTestId("heading3-icon")).toBeInTheDocument();
      expect(screen.getByTestId("heading4-icon")).toBeInTheDocument();
    });

    it("should render alignment buttons", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      expect(screen.getByTestId("fa-align-left")).toBeInTheDocument();
      expect(screen.getByTestId("fa-align-center")).toBeInTheDocument();
      expect(screen.getByTestId("fa-align-right")).toBeInTheDocument();
    });

    it("should render list and other formatting buttons", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      expect(screen.getByTestId("list-icon")).toBeInTheDocument();
      expect(screen.getByTestId("list-ordered-icon")).toBeInTheDocument();
      expect(screen.getByTestId("quote-icon")).toBeInTheDocument();
      expect(screen.getByTestId("corner-down-left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("undo-icon")).toBeInTheDocument();
      expect(screen.getByTestId("redo-icon")).toBeInTheDocument();
    });

    it("should render clear button and horizontal rule button", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      expect(screen.getByText("Clear")).toBeInTheDocument();
      expect(screen.getByText("━━━")).toBeInTheDocument();
    });

    it("should return null when editor is null", () => {
      const { container } = render(<EditorMenuBar editor={null as unknown} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Font Family Selection", () => {
    it("should call setFontFamily when font family is changed", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const fontFamilySelect = screen.getByDisplayValue("Arial");
      await user.selectOptions(fontFamilySelect, "Georgia");

      expect(mockEditor.chain().focus().setFontFamily).toHaveBeenCalledWith(
        "Georgia",
      );
    });
  });

  describe("Font Size Selection", () => {
    it("should call setFontSize when font size is changed", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const fontSizeSelect = screen.getByDisplayValue("12px");
      await user.selectOptions(fontSizeSelect, "18px");

      expect(mockEditor.chain().focus().setFontSize).toHaveBeenCalledWith(
        "18px",
      );
    });
  });

  describe("Formatting Buttons", () => {
    it("should toggle bold when bold button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const boldButton = screen.getByTitle("Bold");
      await user.click(boldButton);

      expect(mockEditor.chain().focus().toggleBold).toHaveBeenCalled();
    });

    it("should toggle italic when italic button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const italicButton = screen.getByTitle("Italic");
      await user.click(italicButton);

      expect(mockEditor.chain().focus().toggleItalic).toHaveBeenCalled();
    });

    it("should toggle strike when strike button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const strikeButton = screen.getByTitle("Strike");
      await user.click(strikeButton);

      expect(mockEditor.chain().focus().toggleStrike).toHaveBeenCalled();
    });

    it("should toggle code when code button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const codeButton = screen.getByTitle("Code");
      await user.click(codeButton);

      expect(mockEditor.chain().focus().toggleCode).toHaveBeenCalled();
    });

    it("should set paragraph when paragraph button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const paragraphButton = screen.getByTitle("Paragraph");
      await user.click(paragraphButton);

      expect(mockEditor.chain().focus().setParagraph).toHaveBeenCalled();
    });
  });

  describe("Alignment Buttons", () => {
    it("should set text alignment to left", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const alignLeftButton = screen
        .getByTestId("fa-align-left")
        .closest("button");
      await user.click(alignLeftButton!);

      expect(mockEditor.chain().focus().setTextAlign).toHaveBeenCalledWith(
        "left",
      );
    });

    it("should set text alignment to center", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const alignCenterButton = screen
        .getByTestId("fa-align-center")
        .closest("button");
      await user.click(alignCenterButton!);

      expect(mockEditor.chain().focus().setTextAlign).toHaveBeenCalledWith(
        "center",
      );
    });

    it("should set text alignment to right", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const alignRightButton = screen
        .getByTestId("fa-align-right")
        .closest("button");
      await user.click(alignRightButton!);

      expect(mockEditor.chain().focus().setTextAlign).toHaveBeenCalledWith(
        "right",
      );
    });
  });

  describe("Heading Buttons", () => {
    it("should toggle heading level 1", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const h1Button = screen.getByTitle("Heading 1");
      await user.click(h1Button);

      expect(mockEditor.chain().focus().toggleHeading).toHaveBeenCalledWith({
        level: 1,
      });
    });

    it("should toggle heading level 2", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const h2Button = screen.getByTitle("Heading 2");
      await user.click(h2Button);

      expect(mockEditor.chain().focus().toggleHeading).toHaveBeenCalledWith({
        level: 2,
      });
    });

    it("should toggle heading level 3", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const h3Button = screen.getByTitle("Heading 3");
      await user.click(h3Button);

      expect(mockEditor.chain().focus().toggleHeading).toHaveBeenCalledWith({
        level: 3,
      });
    });

    it("should toggle heading level 4", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const h4Button = screen.getByTitle("Heading 4");
      await user.click(h4Button);

      expect(mockEditor.chain().focus().toggleHeading).toHaveBeenCalledWith({
        level: 4,
      });
    });
  });

  describe("List Buttons", () => {
    it("should toggle bullet list", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const bulletListButton = screen.getByTitle("Bullet List");
      await user.click(bulletListButton);

      expect(mockEditor.chain().focus().toggleBulletList).toHaveBeenCalled();
    });

    it("should toggle ordered list", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const orderedListButton = screen.getByTitle("Ordered List");
      await user.click(orderedListButton);

      expect(mockEditor.chain().focus().toggleOrderedList).toHaveBeenCalled();
    });
  });

  describe("Other Formatting Buttons", () => {
    it("should set horizontal rule", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const horizontalRuleButton = screen.getByTitle("Horizontal Rule");
      await user.click(horizontalRuleButton);

      expect(mockEditor.chain().focus().setHorizontalRule).toHaveBeenCalled();
    });

    it("should toggle blockquote", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const blockquoteButton = screen
        .getByTestId("quote-icon")
        .closest("button");
      await user.click(blockquoteButton!);

      expect(mockEditor.chain().focus().toggleBlockquote).toHaveBeenCalled();
    });

    it("should clear formatting", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const clearButton = screen.getByText("Clear");
      await user.click(clearButton);

      expect(mockEditor.chain().focus().unsetAllMarks).toHaveBeenCalled();
      expect(mockEditor.chain().focus().clearNodes).toHaveBeenCalled();
    });

    it("should set hard break", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const hardBreakButton = screen.getByTitle("Hard Break");
      await user.click(hardBreakButton);

      expect(mockEditor.chain().focus().setHardBreak).toHaveBeenCalled();
    });
  });

  describe("Undo/Redo Buttons", () => {
    it("should undo when undo button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const undoButton = screen.getByTitle("Undo");
      await user.click(undoButton);

      expect(mockEditor.chain().focus().undo).toHaveBeenCalled();
    });

    it("should redo when redo button is clicked", async () => {
      const user = userEvent.setup();
      render(<EditorMenuBar editor={mockEditor} />);

      const redoButton = screen.getByTitle("Redo");
      await user.click(redoButton);

      expect(mockEditor.chain().focus().redo).toHaveBeenCalled();
    });
  });

  describe("Active States", () => {
    it("should apply active class to bold button when bold is active", () => {
      const mockEditorWithActiveBold = createMockEditor({
        isActive: jest.fn().mockImplementation((format) => format === "bold"),
      });

      render(<EditorMenuBar editor={mockEditorWithActiveBold} />);

      const boldButton = screen.getByTitle("Bold");
      expect(boldButton).toHaveClass("is-active");
    });

    it("should apply active class to italic button when italic is active", () => {
      const mockEditorWithActiveItalic = createMockEditor({
        isActive: jest.fn().mockImplementation((format) => format === "italic"),
      });

      render(<EditorMenuBar editor={mockEditorWithActiveItalic} />);

      const italicButton = screen.getByTitle("Italic");
      expect(italicButton).toHaveClass("is-active");
    });

    it("should apply active class to heading button when heading is active", () => {
      const mockEditorWithActiveHeading = createMockEditor({
        isActive: jest
          .fn()
          .mockImplementation(
            (format, options) => format === "heading" && options?.level === 1,
          ),
      });

      render(<EditorMenuBar editor={mockEditorWithActiveHeading} />);

      const h1Button = screen.getByTitle("Heading 1");
      expect(h1Button).toHaveClass("is-active");
    });

    it("should apply active class to bullet list button when bullet list is active", () => {
      const mockEditorWithActiveBulletList = createMockEditor({
        isActive: jest
          .fn()
          .mockImplementation((format) => format === "bulletList"),
      });

      render(<EditorMenuBar editor={mockEditorWithActiveBulletList} />);

      const bulletListButton = screen.getByTitle("Bullet List");
      expect(bulletListButton).toHaveClass("is-active");
    });
  });

  describe("Disabled States", () => {
    it("should disable bold button when not available", () => {
      const mockEditorWithDisabledBold = createMockEditor({
        can: () => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: () => false }),
              toggleItalic: () => ({ run: () => true }),
              toggleStrike: () => ({ run: () => true }),
              toggleCode: () => ({ run: () => true }),
              undo: () => ({ run: () => true }),
              redo: () => ({ run: () => true }),
            }),
          }),
        }),
      });

      render(<EditorMenuBar editor={mockEditorWithDisabledBold} />);

      const boldButton = screen.getByTitle("Bold");
      expect(boldButton).toBeDisabled();
    });

    it("should disable undo button when not available", () => {
      const mockEditorWithDisabledUndo = createMockEditor({
        can: () => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: () => true }),
              toggleItalic: () => ({ run: () => true }),
              toggleStrike: () => ({ run: () => true }),
              toggleCode: () => ({ run: () => true }),
              undo: () => ({ run: () => false }),
              redo: () => ({ run: () => true }),
            }),
          }),
        }),
      });

      render(<EditorMenuBar editor={mockEditorWithDisabledUndo} />);

      const undoButton = screen.getByTitle("Undo");
      expect(undoButton).toBeDisabled();
    });

    it("should disable redo button when not available", () => {
      const mockEditorWithDisabledRedo = createMockEditor({
        can: () => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: () => true }),
              toggleItalic: () => ({ run: () => true }),
              toggleStrike: () => ({ run: () => true }),
              toggleCode: () => ({ run: () => true }),
              undo: () => ({ run: () => true }),
              redo: () => ({ run: () => false }),
            }),
          }),
        }),
      });

      render(<EditorMenuBar editor={mockEditorWithDisabledRedo} />);

      const redoButton = screen.getByTitle("Redo");
      expect(redoButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined editor gracefully", () => {
      render(<EditorMenuBar editor={undefined as any} />);
      expect(screen.queryByText("Bold")).not.toBeInTheDocument();
    });

    it("should handle all heading levels correctly", () => {
      render(<EditorMenuBar editor={mockEditor} />);

      const headingButtons = [
        screen.getByTitle("Heading 1"),
        screen.getByTitle("Heading 2"),
        screen.getByTitle("Heading 3"),
        screen.getByTitle("Heading 4"),
      ];

      expect(headingButtons).toHaveLength(4);
    });
  });
});
