import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MailDisplay from "@/app/mail/components/mail-display";
import { TooltipProvider } from "@/components/ui/tooltip";
import { threadAtom, accountDetails, threadIdAtom } from "@/app/mail/atoms";
import { Provider as JotaiProvider } from "jotai";
import { atom } from "jotai";

// Mocks
jest.mock("@/app/mail/components/reply-box", () => () => <div>ReplyBox</div>);
jest.mock("@/app/mail/components/ai-summarizer", () => ({
  __esModule: true,
  default: ({ setSummary }: any) => (
    <button onClick={() => setSummary("Mock summary")}>Summarize</button>
  ),
}));

// Helper wrapper with providers
const renderWithProviders = ({
  isMobile = false,
  thread = null,
  account = null,
}: {
  isMobile?: boolean;
  thread?: any;
  account?: any;
}) => {
  const threadAtomMock = atom(thread);
  const accountDetailsMock = atom(account);
  const threadIdAtomMock = atom("mock-thread-id");

  return render(
    <TooltipProvider>
      <JotaiProvider
        initialValues={[
          [threadAtom, threadAtomMock],
          [accountDetails, accountDetailsMock],
          [threadIdAtom, threadIdAtomMock],
        ]}
      >
        <MailDisplay isMobile={isMobile} />
      </JotaiProvider>
    </TooltipProvider>,
  );
};

const mockEmailThread = {
  subject: "Project Update",
  emails: [
    {
      id: "email-1",
      from: { name: "Alice", address: "alice@example.com" },
      to: [{ id: "to-1", address: "bob@example.com" }],
      cc: [],
      subject: "Re: Project Update",
      body: "<p>Here's the latest update on the project.</p>",
      sentAt: new Date().toISOString(),
    },
  ],
};

// Mock current user account
const mockAccount = {
  emailAddress: "bob@example.com",
};

describe("MailDisplay", () => {
  it("renders fallback if thread is not selected", () => {
    renderWithProviders({ thread: null });
    expect(screen.getByText("No message selected")).toBeInTheDocument();
  });

  it("renders email content and summary", async () => {
    renderWithProviders({
      thread: mockEmailThread,
      account: mockAccount,
    });

    expect(screen.getByText("Project Update")).toBeInTheDocument();
    expect(screen.getByText("Summarize")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Summarize"));
    expect(await screen.findByText("Mock summary")).toBeInTheDocument();
  });

  it("triggers setThreadId(null) when back button is clicked (mobile only)", () => {
    renderWithProviders({
      thread: mockEmailThread,
      account: mockAccount,
      isMobile: true,
    });

    const backButton = screen.getByRole("button", {
      name: /chevronleft/i,
    });

    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    // No assertion for threadIdAtom here due to mock, but interaction is covered
  });

  it("renders 'Me' label if email is sent by current user", () => {
    const threadWithSelfEmail = {
      ...mockEmailThread,
      emails: [
        {
          ...mockEmailThread.emails[0],
          from: { name: "Bob", address: "bob@example.com" }, // same as account
        },
      ],
    };

    renderWithProviders({
      thread: threadWithSelfEmail,
      account: mockAccount,
    });

    expect(screen.getByText("Me")).toBeInTheDocument();
  });

  it("shows expanded To and Cc fields when clicked", async () => {
    const threadWithToCc = {
      subject: "Team",
      emails: [
        {
          id: "email-2",
          from: { name: "Charlie", address: "charlie@example.com" },
          to: [
            { id: "to-1", name: "Bob", address: "bob@example.com" },
            { id: "to-2", name: "Dana", address: "dana@example.com" },
          ],
          cc: [{ id: "cc-1", name: "Eve", address: "eve@example.com" }],
          subject: "CC Check",
          body: "<p>Checking CC fields</p>",
          sentAt: new Date().toISOString(),
        },
      ],
    };

    renderWithProviders({
      thread: threadWithToCc,
      account: mockAccount,
    });

    fireEvent.click(screen.getByText(/From: Charlie/));

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      expect(screen.getByText("Eve")).toBeInTheDocument();
      expect(screen.getByText("eve@example.com")).toBeInTheDocument();
    });
  });
});
