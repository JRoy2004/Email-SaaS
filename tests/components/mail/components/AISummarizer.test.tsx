import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AISummarizer from "@/app/mail/components/ai-summarizer";
import { useAtomValue } from "jotai";
import { convertHtmlToPlainText } from "@/utils/convertHtmlToPlainText";
import { api } from "@/trpc/react";

// Mocks
jest.mock("jotai", () => {
  const actualJotai = jest.requireActual("jotai");
  return {
    ...actualJotai,
    useAtomValue: jest.fn(), // only mock useAtomValue
  };
});

jest.mock("@/utils/convertHtmlToPlainText", () => ({
  convertHtmlToPlainText: jest.fn(),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    chat: {
      summarizeThread: {
        useMutation: jest.fn(),
      },
    },
  },
}));

describe("AISummarizer", () => {
  const mockSetSummary = jest.fn();

  const sampleThread = {
    emails: [
      {
        from: { name: "Alice" },
        sentAt: new Date("2024-05-01T10:00:00Z"),
        subject: "Project Update",
        body: "<p>Hello <b>team</b>,</p><p>Here is the update.</p>",
      },
    ],
  };

  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAtomValue as jest.Mock).mockReturnValue(sampleThread);
    (convertHtmlToPlainText as jest.Mock).mockReturnValue(
      "Hello team,\nHere is the update.",
    );
    (api.chat.summarizeThread.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
  });

  it("renders summarize button", () => {
    render(<AISummarizer setSummary={mockSetSummary} />);
    expect(screen.getByText(/summarize/i)).toBeInTheDocument();
  });

  it("calls mutation with correct context on click", async () => {
    mockMutateAsync.mockResolvedValue("Here is your summary.");

    render(<AISummarizer setSummary={mockSetSummary} />);
    const button = screen.getByRole("button", { name: /summarize/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    const calledContext = mockMutateAsync.mock.calls[0][0].context;

    expect(calledContext).toContain("From: Alice");
    expect(calledContext).toContain("Hello team,\nHere is the update.");
    expect(mockSetSummary).toHaveBeenCalledWith("Here is your summary.");
  });

  it("shows loading state while summarizing", async () => {
    let resolveMutation: (value: any) => void;
    const mutationPromise = new Promise((res) => {
      resolveMutation = res;
    });

    mockMutateAsync.mockReturnValue(mutationPromise);

    render(<AISummarizer setSummary={mockSetSummary} />);
    const button = screen.getByRole("button", { name: /summarize/i });

    fireEvent.click(button);

    expect(await screen.findByText(/summarizing/i)).toBeInTheDocument();

    resolveMutation!("Done!");
  });

  it("handles mutation error gracefully", async () => {
    console.error = jest.fn(); // silence error in test output
    mockMutateAsync.mockRejectedValue(new Error("Something went wrong"));

    render(<AISummarizer setSummary={mockSetSummary} />);
    fireEvent.click(screen.getByRole("button", { name: /summarize/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockSetSummary).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Error occurred during mutation:",
      expect.any(Error),
    );
  });
});
