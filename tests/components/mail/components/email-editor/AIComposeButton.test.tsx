import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIComposeButton from "@/app/mail/components/email-editor/ai-compose-button";
import { useAtomValue } from "jotai";
import { accountDetails, threadAtom } from "@/app/mail/atoms";
import { api } from "@/trpc/react";

jest.mock("@/trpc/react", () => ({
  api: {
    chat: {
      composeEmail: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useAtomValue: jest.fn(),
  };
});

describe("AIComposeButton", () => {
  const mockUseAtomValue = useAtomValue as jest.Mock;
  const mutateAsync = jest.fn();

  const mockAccount = {
    name: "John Doe",
    emailAddress: "john@example.com",
  };

  const mockThread = {
    emails: [
      {
        from: { name: "Alice" },
        sentAt: new Date("2023-01-01T12:00:00Z"),
        subject: "Test Subject",
        body: "<p>Hello <b>World</b></p>",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === accountDetails) return mockAccount;
      if (atom === threadAtom) return mockThread;
    });

    (api.chat.composeEmail.useMutation as jest.Mock).mockReturnValue({
      mutateAsync,
    });
  });

  it("renders button and dialog", async () => {
    render(<AIComposeButton isComposing={false} onGenerate={jest.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(await screen.findByText("AI Compose")).toBeInTheDocument();
    expect(
      screen.getByText(
        "AI will compose reply based on the context of your email thread",
      ),
    ).toBeInTheDocument();
  });

  it("submits prompt and calls onGenerate", async () => {
    const mockResponse = "Generated response from AI.";
    mutateAsync.mockResolvedValueOnce(mockResponse);
    const onGenerate = jest.fn();

    render(<AIComposeButton isComposing={false} onGenerate={onGenerate} />);
    fireEvent.click(screen.getByRole("button"));

    const textarea = await screen.findByPlaceholderText("Enter your prompt");
    await userEvent.type(textarea, "Reply to Alice");

    const askButton = screen.getByText("Ask AI");
    fireEvent.click(askButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: "Reply to Alice" }),
      );
      expect(onGenerate).toHaveBeenCalledWith(mockResponse);
    });
  });

  it("handles mutation error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mutateAsync.mockRejectedValueOnce(new Error("AI failed"));

    render(<AIComposeButton isComposing={false} onGenerate={jest.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    const textarea = await screen.findByPlaceholderText("Enter your prompt");
    await userEvent.type(textarea, "Something smart");

    const askButton = screen.getByText("Ask AI");
    fireEvent.click(askButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error occurred during mutation:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
});
