import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "@/app/mail/components/sidebar";

// Mock the external dependencies
jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

jest.mock("@/components/ui/button", () => ({
  buttonVariants: jest.fn(() => "mocked-button-variant"),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children }) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock("usehooks-ts", () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      getThreadsCount: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock the constants
jest.mock("@/Constants", () => ({
  links: [
    {
      title: "inbox",
      icon: jest.fn(() => <span data-testid="inbox-icon">📧</span>),
      variant: "default",
    },
    {
      title: "drafts",
      icon: jest.fn(() => <span data-testid="drafts-icon">📝</span>),
      variant: "ghost",
    },
    {
      title: "sent",
      icon: jest.fn(() => <span data-testid="sent-icon">📤</span>),
      variant: "ghost",
    },
    {
      title: "trash",
      icon: jest.fn(() => <span data-testid="trash-icon">🗑️</span>),
      variant: "ghost",
    },
    {
      title: "junk",
      icon: jest.fn(() => <span data-testid="junk-icon">🚫</span>),
      variant: "ghost",
    },
  ],
}));

// Import the mocked modules
import { useLocalStorage } from "usehooks-ts";
import { api } from "@/trpc/react";

describe("Sidebar Component", () => {
  let mockSetTab;
  let mockUseQuery;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock functions
    mockSetTab = jest.fn();
    mockUseQuery = jest.fn();

    // Setup default mock implementations
    useLocalStorage.mockImplementation((key, defaultValue) => {
      if (key === "accountId") {
        return ["test-account-id"];
      }
      if (key === "email-tabs") {
        return ["inbox", mockSetTab];
      }
      return [defaultValue, jest.fn()];
    });

    api.account.getThreadsCount.useQuery = mockUseQuery;
  });

  describe("Loading States", () => {
    test("renders loading state", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<Sidebar isCollapsed={false} />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("renders error state", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network error" },
      });

      render(<Sidebar isCollapsed={false} />);
      expect(screen.getByText("Error: Network error")).toBeInTheDocument();
    });

    test("renders empty div when no data", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { container } = render(<Sidebar isCollapsed={false} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe("Expanded Sidebar", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: {
          inboxStatusTrue: 5,
          draftStatusTrue: 2,
          sentStatusTrue: 10,
          trashStatusTrue: 0,
          junkStatusTrue: 1,
        },
        isLoading: false,
        error: null,
      });
    });

    test("renders all navigation items", () => {
      render(<Sidebar isCollapsed={false} />);

      expect(screen.getByText("Inbox")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
      expect(screen.getByText("Sent")).toBeInTheDocument();
      expect(screen.getByText("Trash")).toBeInTheDocument();
      expect(screen.getByText("Junk")).toBeInTheDocument();
    });

    test("displays correct counts", () => {
      render(<Sidebar isCollapsed={false} />);

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    test("does not display zero counts", () => {
      render(<Sidebar isCollapsed={false} />);

      const trashSection = screen.getByText("Trash").closest("span");
      expect(trashSection).not.toHaveTextContent("0");
    });

    test("calls setTab when item is clicked", () => {
      render(<Sidebar isCollapsed={false} />);

      fireEvent.click(screen.getByText("Drafts"));
      expect(mockSetTab).toHaveBeenCalledWith("drafts");
    });

    test("renders icons for each item", () => {
      render(<Sidebar isCollapsed={false} />);

      expect(screen.getByTestId("inbox-icon")).toBeInTheDocument();
      expect(screen.getByTestId("drafts-icon")).toBeInTheDocument();
      expect(screen.getByTestId("sent-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
      expect(screen.getByTestId("junk-icon")).toBeInTheDocument();
    });
  });

  describe("Collapsed Sidebar", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: {
          inboxStatusTrue: 3,
          draftStatusTrue: 1,
          sentStatusTrue: 7,
          trashStatusTrue: 0,
          junkStatusTrue: 2,
        },
        isLoading: false,
        error: null,
      });
    });

    test("renders tooltips for all items", () => {
      render(<Sidebar isCollapsed={true} />);

      expect(screen.getAllByTestId("tooltip")).toHaveLength(5);
      expect(screen.getAllByTestId("tooltip-trigger")).toHaveLength(5);
    });

    test("tooltip content contains correct information", () => {
      render(<Sidebar isCollapsed={true} />);

      const tooltipContents = screen.getAllByTestId("tooltip-content");

      expect(tooltipContents[0]).toHaveTextContent("Inbox");
      expect(tooltipContents[0]).toHaveTextContent("3");

      expect(tooltipContents[1]).toHaveTextContent("Drafts");
      expect(tooltipContents[1]).toHaveTextContent("1");

      expect(tooltipContents[2]).toHaveTextContent("Sent");
      expect(tooltipContents[2]).toHaveTextContent("7");
    });

    test("tooltip does not show zero counts", () => {
      render(<Sidebar isCollapsed={true} />);

      const tooltipContents = screen.getAllByTestId("tooltip-content");
      const trashTooltip = tooltipContents[3];

      expect(trashTooltip).toHaveTextContent("Trash");
      expect(trashTooltip).not.toHaveTextContent("0");
    });

    test("calls setTab when collapsed item is clicked", () => {
      render(<Sidebar isCollapsed={true} />);

      const tooltipTriggers = screen.getAllByTestId("tooltip-trigger");
      fireEvent.click(tooltipTriggers[1]);

      expect(mockSetTab).toHaveBeenCalledWith("drafts");
    });

    test("renders screen reader text", () => {
      render(<Sidebar isCollapsed={true} />);

      expect(screen.getByText("inbox")).toHaveClass("sr-only");
      expect(screen.getByText("drafts")).toHaveClass("sr-only");
      expect(screen.getByText("sent")).toHaveClass("sr-only");
      expect(screen.getByText("trash")).toHaveClass("sr-only");
      expect(screen.getByText("junk")).toHaveClass("sr-only");
    });
  });

  describe("Tab Selection", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: {
          inboxStatusTrue: 1,
          draftStatusTrue: 1,
          sentStatusTrue: 1,
          trashStatusTrue: 1,
          junkStatusTrue: 1,
        },
        isLoading: false,
        error: null,
      });
    });

    test("shows active state for selected tab", () => {
      // Mock drafts as selected
      useLocalStorage.mockImplementation((key, defaultValue) => {
        if (key === "accountId") return ["test-account-id"];
        if (key === "email-tabs") return ["drafts", mockSetTab];
        return [defaultValue, jest.fn()];
      });

      render(<Sidebar isCollapsed={false} />);

      const draftsButton = screen.getByText("Drafts").closest("span");
      expect(draftsButton).toHaveClass("mocked-button-variant");
    });

    test("handles case-insensitive tab comparison", () => {
      useLocalStorage.mockImplementation((key, defaultValue) => {
        if (key === "accountId") return ["test-account-id"];
        if (key === "email-tabs") return ["INBOX", mockSetTab]; // uppercase
        return [defaultValue, jest.fn()];
      });

      render(<Sidebar isCollapsed={false} />);

      // Should still match inbox despite case difference
      const inboxButton = screen.getByText("Inbox").closest("span");
      expect(inboxButton).toHaveClass("mocked-button-variant");
    });
  });

  describe("Data Handling", () => {
    test("handles missing data properties", () => {
      mockUseQuery.mockReturnValue({
        data: {
          inboxStatusTrue: 5,
          // Missing other properties
        },
        isLoading: false,
        error: null,
      });

      render(<Sidebar isCollapsed={false} />);

      expect(screen.getByText("Inbox")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });

    test("handles undefined data object", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<Sidebar isCollapsed={false} />);

      expect(screen.getByText("Inbox")).toBeInTheDocument();
      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    test("calls API with correct accountId", () => {
      useLocalStorage.mockImplementation((key, defaultValue) => {
        if (key === "accountId") return ["custom-account-123"];
        if (key === "email-tabs") return ["inbox", mockSetTab];
        return [defaultValue, jest.fn()];
      });

      mockUseQuery.mockReturnValue({
        data: { inboxStatusTrue: 1 },
        isLoading: false,
        error: null,
      });

      render(<Sidebar isCollapsed={false} />);

      expect(mockUseQuery).toHaveBeenCalledWith({
        accountId: "custom-account-123",
      });
    });
  });

  describe("Component Structure", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: { inboxStatusTrue: 1 },
        isLoading: false,
        error: null,
      });
    });

    test("applies correct data-collapsed attribute", () => {
      const { container } = render(<Sidebar isCollapsed={true} />);

      const sidebarDiv = container.querySelector('[data-collapsed="true"]');
      expect(sidebarDiv).toBeInTheDocument();
    });

    test("applies correct CSS classes", () => {
      const { container } = render(<Sidebar isCollapsed={false} />);

      const sidebarDiv = container.querySelector(".group");
      expect(sidebarDiv).toHaveClass("flex", "flex-col", "gap-4", "py-2");
    });
  });
});
