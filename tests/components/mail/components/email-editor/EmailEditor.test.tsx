import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailEditor from "@/app/mail/components/email-editor/email-editor";

// Mock TipTap
const mockEditor = {
  commands: {
    insertContent: jest.fn(),
    clearContent: jest.fn(),
  },
  getHTML: jest.fn().mockReturnValue("<p>Test content</p>"),
  on: jest.fn(),
  off: jest.fn(),
  destroy: jest.fn(),
};

const mockUseEditor = jest.fn().mockReturnValue(mockEditor);

jest.mock("@tiptap/react", () => ({
  useEditor: () => mockUseEditor(),
  EditorContent: ({ editor, value, className }: any) => (
    <div data-testid="editor-content" className={className}>
      Editor Content - {value}
    </div>
  ),
}));

// Mock TipTap Extensions
jest.mock("@tiptap/extension-link", () => ({}));
jest.mock("@tiptap/extension-typography", () => ({}));
jest.mock("@tiptap/starter-kit", () => ({}));
jest.mock("@tiptap/extension-underline", () => ({}));
jest.mock("@tiptap/extension-text-align", () => ({
  configure: jest.fn().mockReturnValue({}),
}));
jest.mock("@tiptap/extension-color", () => ({}));
jest.mock("@tiptap/extension-text-style", () => ({}));
jest.mock("@tiptap/extension-highlight", () => ({}));
jest.mock("@tiptap/extension-placeholder", () => ({
  configure: jest.fn().mockReturnValue({}),
}));

// Mock custom extensions - Update these paths to match your actual project structure
jest.mock("@/app/mail/components/email-editor/extensions/FontFamily", () => ({
  FontFamily: {},
}));
jest.mock("@/app/mail/components/email-editor/extensions/FontSize", () => ({
  FontSize: {},
}));

// Mock UI Components
jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: any) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ id, placeholder, value, onChange, ...props }: any) => (
    <input
      data-testid={id || "input"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <div data-testid="separator" />,
}));

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open, onOpenChange }: any) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: any) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: any) => (
    <div data-testid="alert-dialog-title">{children}</div>
  ),
  AlertDialogFooter: ({ children }: any) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogAction: ({ children }: any) => (
    <div data-testid="alert-dialog-action">{children}</div>
  ),
}));

// Mock custom components - Update these paths to match your actual project structure
jest.mock("@/app/mail/components/email-editor/menu-bar", () => {
  return function EditorMenuBar({ editor }: any) {
    return <div data-testid="editor-menu-bar">Menu Bar</div>;
  };
});

jest.mock("@/app/mail/components/email-editor/tag-input", () => {
  return function TagInput({ label, values, onChange, placeholder }: any) {
    return (
      <div data-testid={`tag-input-${label.toLowerCase()}`}>
        <label>{label}</label>
        <input
          data-testid={`tag-input-${label.toLowerCase()}-field`}
          placeholder={placeholder}
          onChange={(e) =>
            onChange([{ label: e.target.value, value: e.target.value }])
          }
        />
        <div data-testid={`tag-values-${label.toLowerCase()}`}>
          {values.map((v: any, i: number) => (
            <span key={i}>{v.label}</span>
          ))}
        </div>
      </div>
    );
  };
});

jest.mock("@/app/mail/components/email-editor/ai-compose-button", () => {
  return function AIComposeButton({ isComposing, onGenerate }: any) {
    return (
      <button
        data-testid="ai-compose-button"
        onClick={() => onGenerate("Generated content")}
      >
        AI Compose {isComposing ? "(Composing)" : ""}
      </button>
    );
  };
});

// Mock console.log to avoid noise in tests
const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

describe("EmailEditor", () => {
  const defaultProps = {
    subject: "",
    setSubject: jest.fn(),
    toValues: [],
    setToValues: jest.fn(),
    ccValues: [],
    setCcValues: jest.fn(),
    to: ["test@example.com"],
    handleSend: jest.fn(),
    isSending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the editor with all components", () => {
      render(<EmailEditor {...defaultProps} />);

      expect(screen.getByTestId("editor-menu-bar")).toBeInTheDocument();
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
      expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("should render draft info with recipients", () => {
      render(<EmailEditor {...defaultProps} />);

      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("to test@example.com")).toBeInTheDocument();
    });

    it("should render multiple recipients correctly", () => {
      render(
        <EmailEditor
          {...defaultProps}
          to={["test1@example.com", "test2@example.com"]}
        />,
      );

      expect(
        screen.getByText("to test1@example.com, test2@example.com"),
      ).toBeInTheDocument();
    });

    it("should render AI compose button with tooltip", () => {
      render(<EmailEditor {...defaultProps} />);

      expect(screen.getByTestId("ai-compose-button")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
    });

    it("should return null when editor is not available", () => {
      mockUseEditor.mockReturnValueOnce(null);

      const { container } = render(<EmailEditor {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Expanded State", () => {
    it("should not show expanded fields by default", () => {
      render(<EmailEditor {...defaultProps} />);

      expect(screen.queryByTestId("tag-input-to")).not.toBeInTheDocument();
      expect(screen.queryByTestId("tag-input-cc")).not.toBeInTheDocument();
      expect(screen.queryByTestId("subject")).not.toBeInTheDocument();
    });

    it("should show expanded fields when defaultToolbarExpanded is true", () => {
      render(<EmailEditor {...defaultProps} defaultToolbarExpanded={true} />);

      expect(screen.getByTestId("tag-input-to")).toBeInTheDocument();
      expect(screen.getByTestId("tag-input-cc")).toBeInTheDocument();
      expect(screen.getByTestId("subject")).toBeInTheDocument();
    });

    it("should toggle expanded state when clicking draft area", async () => {
      const user = userEvent.setup();
      render(<EmailEditor {...defaultProps} />);

      // Initially collapsed
      expect(screen.queryByTestId("tag-input-to")).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByText("Draft"));

      expect(screen.getByTestId("tag-input-to")).toBeInTheDocument();
      expect(screen.getByTestId("tag-input-cc")).toBeInTheDocument();
      expect(screen.getByTestId("subject")).toBeInTheDocument();

      // Click again to collapse
      await user.click(screen.getByText("Draft"));

      expect(screen.queryByTestId("tag-input-to")).not.toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should update subject when typing", async () => {
      const user = userEvent.setup();
      const setSubject = jest.fn();

      render(
        <EmailEditor
          {...defaultProps}
          setSubject={setSubject}
          defaultToolbarExpanded={true}
        />,
      );

      const subjectInput = screen.getByTestId("subject");
      fireEvent.change(subjectInput, { target: { value: "Test Subject" } });

      expect(setSubject).toHaveBeenCalledWith("Test Subject");
    });

    it("should update to values when TagInput changes", async () => {
      const user = userEvent.setup();
      const setToValues = jest.fn();

      render(
        <EmailEditor
          {...defaultProps}
          setToValues={setToValues}
          defaultToolbarExpanded={true}
        />,
      );

      const toInput = screen.getByTestId("tag-input-to-field");
      await user.type(toInput, "new@example.com");

      expect(setToValues).toHaveBeenCalledWith([
        { label: "new@example.com", value: "new@example.com" },
      ]);
    });

    it("should update cc values when TagInput changes", async () => {
      const user = userEvent.setup();
      const setCcValues = jest.fn();

      render(
        <EmailEditor
          {...defaultProps}
          setCcValues={setCcValues}
          defaultToolbarExpanded={true}
        />,
      );

      const ccInput = screen.getByTestId("tag-input-cc-field");
      await user.type(ccInput, "cc@example.com");

      expect(setCcValues).toHaveBeenCalledWith([
        { label: "cc@example.com", value: "cc@example.com" },
      ]);
    });

    it("should display current values in TagInput components", () => {
      const toValues = [
        { label: "test@example.com", value: "test@example.com" },
      ];
      const ccValues = [{ label: "cc@example.com", value: "cc@example.com" }];

      render(
        <EmailEditor
          {...defaultProps}
          toValues={toValues}
          ccValues={ccValues}
          defaultToolbarExpanded={true}
        />,
      );

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("cc@example.com")).toBeInTheDocument();
    });
  });

  describe("AI Compose Functionality", () => {
    it("should call onGenerate when AI compose button is clicked", async () => {
      const user = userEvent.setup();
      render(<EmailEditor {...defaultProps} />);

      const aiButton = screen.getByTestId("ai-compose-button");
      await user.click(aiButton);

      expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(
        "Generated content",
      );
    });

    it("should show composing state when defaultToolbarExpanded is true", () => {
      render(<EmailEditor {...defaultProps} defaultToolbarExpanded={true} />);

      expect(screen.getByText("AI Compose (Composing)")).toBeInTheDocument();
    });
  });

  describe("Send Functionality", () => {
    it("should show confirmation dialog when subject is empty", async () => {
      const user = userEvent.setup();
      const handleSend = jest.fn();

      render(
        <EmailEditor {...defaultProps} subject="" handleSend={handleSend} />,
      );

      const sendButton = screen.getByText("Send");
      await user.click(sendButton);

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you absolutely confirm to send an Email with/),
      ).toBeInTheDocument();
      expect(screen.getByText("Empty")).toBeInTheDocument();
      expect(handleSend).not.toHaveBeenCalled();
    });

    it("should show confirmation dialog when subject is only whitespace", async () => {
      const user = userEvent.setup();
      const handleSend = jest.fn();

      render(
        <EmailEditor {...defaultProps} subject="   " handleSend={handleSend} />,
      );

      const sendButton = screen.getByText("Send");
      await user.click(sendButton);

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(handleSend).not.toHaveBeenCalled();
    });

    it("should cancel sending from confirmation dialog", async () => {
      const user = userEvent.setup();
      const handleSend = jest.fn();

      render(
        <EmailEditor {...defaultProps} subject="" handleSend={handleSend} />,
      );

      // Open dialog
      const sendButton = screen.getByText("Send");
      await user.click(sendButton);

      // Click cancel
      const cancelButton = screen.getByTestId("alert-dialog-cancel");
      await user.click(cancelButton);

      expect(handleSend).not.toHaveBeenCalled();
    });

    it("should disable send button when isSending is true", () => {
      render(<EmailEditor {...defaultProps} isSending={true} />);

      const sendButton = screen.getByText("Send");
      expect(sendButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle editor being null initially", () => {
      mockUseEditor.mockReturnValueOnce(null);

      const { container } = render(<EmailEditor {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
