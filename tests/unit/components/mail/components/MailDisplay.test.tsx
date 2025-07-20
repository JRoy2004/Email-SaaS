import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider as JotaiProvider, createStore } from "jotai";
import {
  accountDetails,
  threadIdAtom,
  threadsListAtom,
  threadAtom,
} from "@/app/mail/atoms";

// Mock other components
jest.mock("@/app/mail/components/reply-box", () => () => <div>ReplyBox</div>);
jest.mock("@/app/mail/components/ai-summarizer", () => ({
  __esModule: true,
  default: ({ setSummary }: any) => (
    <button onClick={() => setSummary("Mock summary")}>Summarize</button>
  ),
}));

// Mock DOMPurify
jest.mock("dompurify", () => ({
  sanitize: jest.fn((html) => html),
}));

// Mock date-fns
jest.mock("date-fns/format", () => ({
  format: jest.fn((date, formatStr) => "Jul 20, 2025, 8:42:51 AM"),
}));

import MailDisplay from "@/app/mail/components/mail-display";

const mockEmailThread = {
  id: "19825d1f9b69aa63",
  subject: "back end developer: Biostate AI - Backend Engineer and more",
  lastMessageDate: "2025-07-20T03:12:51.000Z",
  participantIds: ["cmd4nbo430009asxk6cwothu3", "cmd4nbnn00005asxkk6dndp74"],
  accountId: "130581",
  done: false,
  inboxStatus: true,
  draftStatus: false,
  sentStatus: false,
  trashStatus: false,
  junkStatus: false,
  emails: [
    {
      from: {
        id: "cmd4nbo430009asxk6cwothu3",
        name: "LinkedIn Job Alerts",
        address: "jobalerts-noreply@linkedin.com",
        raw: null,
        accountId: "130581",
      },
      to: [
        {
          id: "cmd4nbnn00005asxkk6dndp74",
          name: "Jagannath Roy",
          address: "royjagannath258@gmail.com",
        },
      ],
      cc: [],
      body: "Body text of the email",
      bodySnippet: "Biostate AI Backend Engineer...",
      emailLabel: "inbox",
      subject: "back end developer: Biostate AI - Backend Engineer and more",
      sysLabels: ["unread", "inbox"],
      sysClassifications: ["updates"],
      id: "19825d1f9b69aa63",
      sentAt: "2025-07-20T03:12:51.000Z",
    },
  ],
};

const mockAccount = {
  id: "130581",
  emailAddress: "bob@example.com",
  name: "Bob Smith",
};

const mockEmailThreadWithMultipleEmails = {
  ...mockEmailThread,
  emails: [
    ...mockEmailThread.emails,
    {
      from: {
        id: "cmd4nbnn00005asxkk6dndp74",
        name: "Jagannath Roy",
        address: "royjagannath258@gmail.com",
        raw: null,
        accountId: "130581",
      },
      to: [
        {
          id: "cmd4nbo430009asxk6cwothu3",
          name: "LinkedIn Job Alerts",
          address: "jobalerts-noreply@linkedin.com",
        },
      ],
      cc: [
        {
          id: "cc1",
          name: "CC User",
          address: "cc@example.com",
        },
      ],
      body: "<p>Reply email with <strong>HTML</strong> content</p>",
      bodySnippet: "Reply email...",
      emailLabel: "inbox",
      subject:
        "Re: back end developer: Biostate AI - Backend Engineer and more",
      sysLabels: ["unread", "inbox"],
      sysClassifications: ["updates"],
      id: "reply123",
      sentAt: "2025-07-20T04:12:51.000Z",
    },
  ],
};

const renderWithProviders = ({
  isMobile = false,
  thread = null,
  account = null,
}: {
  isMobile?: boolean;
  thread?: any;
  account?: any;
}) => {
  const store = createStore();
  store.set(accountDetails, account);

  if (thread) {
    store.set(threadsListAtom, [thread]);
    store.set(threadIdAtom, thread.id);
  } else {
    store.set(threadsListAtom, []);
    store.set(threadIdAtom, null);
  }

  return render(
    <TooltipProvider>
      <JotaiProvider store={store}>
        <MailDisplay isMobile={isMobile} />
      </JotaiProvider>
    </TooltipProvider>,
  );
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

    expect(screen.getByText("Body text of the email")).toBeInTheDocument();
    expect(screen.getByText("Summarize")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Summarize"));
    await waitFor(() => {
      expect(screen.getByText("Mock summary")).toBeInTheDocument();
    });
  });

  describe("Mobile view", () => {
    it("does not render back arrow on desktop", () => {
      renderWithProviders({
        isMobile: false,
        thread: mockEmailThread,
        account: mockAccount,
      });

      // Check that ChevronLeft is not in the document (back arrow is mobile-only)
      const buttons = screen.getAllByRole("button");
      const backButton = buttons.find((button) =>
        button.querySelector('[data-testid="chevron-left"]'),
      );
      expect(backButton).toBeUndefined();
    });

    it("calls setThreadId when back button is clicked on mobile", () => {
      const store = createStore();
      store.set(accountDetails, mockAccount);
      store.set(threadsListAtom, [mockEmailThread]);
      store.set(threadIdAtom, mockEmailThread.id);

      render(
        <TooltipProvider>
          <JotaiProvider store={store}>
            <MailDisplay isMobile={true} />
          </JotaiProvider>
        </TooltipProvider>,
      );

      const backButton = screen.getAllByRole("button")[0]; // First button should be back button
      fireEvent.click(backButton);

      // Check that threadId is set to null
      expect(store.get(threadIdAtom)).toBeNull();
    });
  });

  describe("Email display", () => {
    it("renders email sender information", () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      expect(screen.getByText("From: LinkedIn Job Alerts")).toBeInTheDocument();
      expect(
        screen.getByText("jobalerts-noreply@linkedin.com"),
      ).toBeInTheDocument();
    });

    it("renders email timestamp", () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      expect(screen.getByText("Jul 20, 2025, 8:42:51 AM")).toBeInTheDocument();
    });

    it("renders avatar fallback with sender initials", () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      expect(screen.getByText("LJA")).toBeInTheDocument(); // LinkedIn Job Alerts initials
    });

    it("shows 'Me' for emails sent by account owner", () => {
      const threadWithOwnEmail = {
        ...mockEmailThread,
        emails: [
          {
            ...mockEmailThread.emails[0],
            from: {
              ...mockEmailThread.emails[0].from,
              address: "bob@example.com", // Same as account email
            },
          },
        ],
      };

      renderWithProviders({
        thread: threadWithOwnEmail,
        account: mockAccount,
      });

      expect(screen.getByText("Me")).toBeInTheDocument();
    });

    it("hides avatar for emails sent by account owner", () => {
      const threadWithOwnEmail = {
        ...mockEmailThread,
        emails: [
          {
            ...mockEmailThread.emails[0],
            from: {
              ...mockEmailThread.emails[0].from,
              address: "bob@example.com",
            },
          },
        ],
      };

      renderWithProviders({
        thread: threadWithOwnEmail,
        account: mockAccount,
      });

      // Avatar should be hidden (have 'hidden' class)
      const avatars = document.querySelectorAll('[class*="hidden"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe("Multiple emails", () => {
    it("renders multiple emails in thread", () => {
      renderWithProviders({
        thread: mockEmailThreadWithMultipleEmails,
        account: mockAccount,
      });

      expect(screen.getByText("Body text of the email")).toBeInTheDocument();
    });
  });

  describe("Summary functionality", () => {
    it("shows summary when generated", async () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      fireEvent.click(screen.getByText("Summarize"));
      await waitFor(() => {
        expect(screen.getByText("Mock summary")).toBeInTheDocument();
      });
    });

    it("resets summary when thread changes", () => {
      const { rerender } = renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      // Generate summary
      fireEvent.click(screen.getByText("Summarize"));

      // Change thread by re-rendering with different thread
      const store = createStore();
      store.set(accountDetails, mockAccount);
      store.set(threadsListAtom, [mockEmailThreadWithMultipleEmails]);
      store.set(threadIdAtom, mockEmailThreadWithMultipleEmails.id);

      rerender(
        <TooltipProvider>
          <JotaiProvider store={store}>
            <MailDisplay isMobile={false} />
          </JotaiProvider>
        </TooltipProvider>,
      );

      // Summary should be reset (not visible)
      expect(screen.queryByText("Mock summary")).not.toBeInTheDocument();
    });
  });

  describe("Action buttons", () => {
    it("renders all action buttons", () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      // Check for tooltip content or aria-labels
      expect(screen.getByText("Reply")).toBeInTheDocument();
      expect(screen.getByText("Reply all")).toBeInTheDocument();
      expect(screen.getByText("Forward")).toBeInTheDocument();
    });

    it("disables action buttons when no thread is selected", () => {
      renderWithProviders({ thread: null });

      const buttons = screen.getAllByRole("button");
      // Most buttons should be disabled when no thread is selected
      const disabledButtons = buttons.filter((button) =>
        button.hasAttribute("disabled"),
      );
      expect(disabledButtons.length).toBeGreaterThan(0);
    });
  });

  describe("ReplyBox", () => {
    it("renders ReplyBox component", () => {
      renderWithProviders({
        thread: mockEmailThread,
        account: mockAccount,
      });

      expect(screen.getByText("ReplyBox")).toBeInTheDocument();
    });
  });

  describe("Email body sanitization", () => {
    it("renders sanitized HTML content", () => {
      renderWithProviders({
        thread: mockEmailThreadWithMultipleEmails,
        account: mockAccount,
      });

      // The HTML content should be rendered
      expect(screen.getByText("HTML")).toBeInTheDocument();
    });
  });

  describe("Avatar fallbacks", () => {
    it("handles email addresses without names", () => {
      const threadWithoutNames = {
        ...mockEmailThread,
        emails: [
          {
            ...mockEmailThread.emails[0],
            from: {
              ...mockEmailThread.emails[0].from,
              name: null,
              address: "test.user@example.com",
            },
          },
        ],
      };

      renderWithProviders({
        thread: threadWithoutNames,
        account: mockAccount,
      });

      // Should show domain-based fallback
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });
});
