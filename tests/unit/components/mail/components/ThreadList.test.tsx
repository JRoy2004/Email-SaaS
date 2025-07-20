import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ThreadList from "@/app/mail/components/thread-list";
import { useAtomValue, useAtom } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import useThreads from "@/app/mail/hooks/useThreads";

jest.mock("usehooks-ts", () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useAtom: jest.fn(),
    useAtomValue: jest.fn(),
  };
});

jest.mock("@/app/mail/hooks/useThreads", () => jest.fn());

jest.mock("@/components/get-new-emails.tsx", () => () => (
  <div>Mocked GetNewEmails</div>
));

describe("ThreadList Component", () => {
  const mockSetThreadId = jest.fn();

  const mockThread = {
    id: "thread1",
    subject: "Hello World",
    lastMessageDate: new Date().toISOString(),
    emails: [
      {
        sentAt: new Date().toISOString(),
        sysClassifications: ["Work", "Important"],
        bodySnippet: "Test snippet content",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalStorage as jest.Mock).mockReturnValue(["mock-account"]);
    (useAtom as jest.Mock).mockReturnValue(["thread1", mockSetThreadId]);

    (useAtomValue as jest.Mock).mockImplementation((atom) => {
      if (atom.toString().includes("searchingAtom")) return false;
      if (atom.toString().includes("searchValueAtom")) return "";
    });
  });

  it("renders loading state", () => {
    (useThreads as jest.Mock).mockReturnValue({
      threads: [],
      isFetching: true,
      totalPages: 1,
    });

    render(<ThreadList done={false} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders threads with subject, snippet and labels", () => {
    (useThreads as jest.Mock).mockReturnValue({
      threads: [mockThread],
      isFetching: false,
      totalPages: 1,
    });

    render(<ThreadList done={false} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("Test snippet content")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
  });

  it("does not render 'unread' badge", () => {
    const thread = {
      ...mockThread,
      emails: [
        {
          ...mockThread.emails[0],
          sysClassifications: ["unread"],
        },
      ],
    };

    (useThreads as jest.Mock).mockReturnValue({
      threads: [thread],
      isFetching: false,
      totalPages: 1,
    });

    render(<ThreadList done={false} />);
    expect(screen.queryByText("unread")).not.toBeInTheDocument();
  });

  it("calls setThreadId when a thread is clicked", () => {
    (useThreads as jest.Mock).mockReturnValue({
      threads: [mockThread],
      isFetching: false,
      totalPages: 1,
    });

    render(<ThreadList done={false} />);
    fireEvent.click(screen.getByText("Hello World"));
    expect(mockSetThreadId).toHaveBeenCalledWith("thread1");
  });

  it("renders and clicks pagination controls", () => {
    (useThreads as jest.Mock).mockReturnValue({
      threads: [mockThread],
      isFetching: false,
      totalPages: 2,
    });

    render(<ThreadList done={false} />);

    const nextBtn = screen.getByLabelText("Go to next page");
    act(() => {
      fireEvent.click(nextBtn);
    });

    // You can test button disabled state, ellipsis, etc. here too
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("groups search result threads under dates", () => {
    (useAtomValue as jest.Mock).mockImplementation((atom) => {
      if (atom.toString().includes("searchingAtom")) return false;
      if (atom.toString().includes("searchValueAtom")) return "inbox";
    });

    (useThreads as jest.Mock).mockReturnValue({
      threads: [mockThread],
      isFetching: false,
      totalPages: 1,
    });

    render(<ThreadList done={false} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument(); // no date section
  });
});
