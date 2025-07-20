/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Mail from "@/app/mail/mail"; // Adjust import path as needed
import { useAtomValue } from "jotai";
import useIsMobile from "@/app/mail/hooks/useIsMobile";

// Mocks
jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual, // keep real atoms and functions
    useAtomValue: jest.fn(), // mock only this
  };
});

jest.mock("@/app/mail/hooks/useIsMobile", () => jest.fn());

// Mock child components with minimal return values to avoid complexity
jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <div data-testid="separator" />,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
}));

jest.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div data-testid="handle" />,
}));

jest.mock("@/components/theme-toggle", () => () => (
  <div data-testid="theme-toggle" />
));
jest.mock("@/app/mail/components/account-switcher", () => () => (
  <div>AccountSwitcher</div>
));
jest.mock("@/app/mail/components/sidebar", () => () => <div>Sidebar</div>);
jest.mock(
  "@/app/mail/components/thread-list",
  () =>
    ({ done }: { done: boolean }) => (
      <div>{done ? "ThreadList Done" : "ThreadList ToDo"}</div>
    ),
);
jest.mock("@/app/mail/components/mail-display", () => ({ isMobile }: any) => (
  <div>{`MailDisplay (Mobile: ${isMobile})`}</div>
));
jest.mock("@/app/mail/components/compose-email-button", () => () => (
  <div>ComposeButton</div>
));
jest.mock("@/app/mail/components/search-bar", () => () => <div>SearchBar</div>);
jest.mock("@/app/mail/components/ask-AI", () => () => <div>AskAI</div>);

describe("Mail component", () => {
  const mockUseAtomValue = useAtomValue as jest.Mock;
  const mockUseIsMobile = useIsMobile as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders inbox layout on desktop with no thread selected", () => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseAtomValue.mockReturnValue(""); // no thread selected

    render(
      <Mail
        defaultLayout={[20, 30, 50]}
        navCollasedSize={50}
        defaultCollapsed={false}
      />,
    );

    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("MailDisplay (Mobile: false)")).toBeInTheDocument();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("ComposeButton")).toBeInTheDocument();
    expect(screen.getByText("AskAI")).toBeInTheDocument();
  });

  it("renders only mail view on mobile when thread is selected", () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseAtomValue.mockReturnValue("thread-123");

    render(
      <Mail
        defaultLayout={[20, 30, 50]}
        navCollasedSize={50}
        defaultCollapsed={false}
      />,
    );

    expect(screen.getByText("MailDisplay (Mobile: true)")).toBeInTheDocument();
    expect(screen.queryByText("Inbox")).not.toBeInTheDocument();
  });

  it("renders only list view on mobile when thread is not selected", () => {
    mockUseIsMobile.mockReturnValue(true);
    mockUseAtomValue.mockReturnValue("");

    render(
      <Mail
        defaultLayout={[20, 30, 50]}
        navCollasedSize={50}
        defaultCollapsed={false}
      />,
    );

    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.queryByText("MailDisplay")).not.toBeInTheDocument();
  });
});
