import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReplyBox from "@/app/mail/components/reply-box";
import { useAtomValue } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import { toast } from "sonner";

// Mocks
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

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockMutate = jest.fn();
const mockUseMutation = jest.fn(() => ({
  mutate: mockMutate,
  isPending: false,
}));

// Mock EmailEditor with test ID
jest.mock(
  "@/app/mail/components/email-editor/email-editor",
  () => (props: any) => {
    return (
      <div data-testid="email-editor">
        <button onClick={() => props.handleSend("Test email body")}>
          Send
        </button>
      </div>
    );
  },
);

// Mock TRPC query + mutation
jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      getReplyDetails: {
        useQuery: jest.fn(),
      },
      sendEmail: {
        useMutation: () => mockUseMutation(),
      },
    },
  },
}));

const mockReplyDetails = {
  id: "reply-id",
  subject: "Hello",
  from: { name: "Sender", address: "sender@example.com" },
  to: [{ name: "Recipient", address: "recipient@example.com" }],
  cc: [{ name: "CC User", address: "cc@example.com" }],
};

describe("ReplyBox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAtomValue as jest.Mock).mockReturnValue("mock-thread-id");
    (useLocalStorage as jest.Mock).mockReturnValue(["mock-account"]);
  });

  it("does not render EmailEditor if no replyDetails", () => {
    const useQuery =
      require("@/trpc/react").api.account.getReplyDetails.useQuery;
    useQuery.mockReturnValue({ data: undefined });

    render(<ReplyBox />);
    expect(screen.queryByTestId("email-editor")).not.toBeInTheDocument();
  });

  it("renders EmailEditor with replyDetails", async () => {
    const useQuery =
      require("@/trpc/react").api.account.getReplyDetails.useQuery;
    useQuery.mockReturnValue({ data: mockReplyDetails });

    render(<ReplyBox />);
    expect(await screen.findByTestId("email-editor")).toBeInTheDocument();
  });

  it("sends email on handleSend and shows success toast", async () => {
    const useQuery =
      require("@/trpc/react").api.account.getReplyDetails.useQuery;
    useQuery.mockReturnValue({ data: mockReplyDetails });

    mockUseMutation.mockReturnValue({
      mutate: (input: any, { onSuccess }: any) => {
        expect(input.subject).toBe("Re: Hello");
        onSuccess(); // Simulate success
      },
      isPending: false,
    });

    render(<ReplyBox />);
    fireEvent.click(await screen.findByText("Send"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Email sent");
    });
  });

  it("handles email send failure and shows error toast", async () => {
    const useQuery =
      require("@/trpc/react").api.account.getReplyDetails.useQuery;
    useQuery.mockReturnValue({ data: mockReplyDetails });

    mockUseMutation.mockReturnValue({
      mutate: (input: any, { onError }: any) => {
        onError(); // Simulate error
      },
      isPending: false,
    });

    render(<ReplyBox />);
    fireEvent.click(await screen.findByText("Send"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error");
    });
  });

  it("prefixes subject with 'Re:' if missing", async () => {
    const useQuery =
      require("@/trpc/react").api.account.getReplyDetails.useQuery;
    useQuery.mockReturnValue({
      data: {
        ...mockReplyDetails,
        subject: "New Subject", // no "Re:"
      },
    });

    const mutateMock = jest.fn((_input, { onSuccess }: any) => {
      onSuccess();
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });

    render(<ReplyBox />);
    fireEvent.click(await screen.findByText("Send"));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
      expect(mutateMock.mock.calls[0][0].subject).toBe("Re: New Subject");
    });
  });
});
