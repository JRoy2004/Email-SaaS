import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ComposeEmailButton from "@/app/mail/components/compose-email-button";
import { Provider as JotaiProvider, atom } from "jotai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { accountDetails } from "@/app/mail/atoms";

// Mock API and toast
jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      sendEmail: {
        useMutation: () => ({
          mutate: jest.fn((data, { onSuccess }) => onSuccess?.()),
          isPending: false,
        }),
      },
    },
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/app/mail/components/email-editor/email-editor", () => ({
  __esModule: true,
  default: ({
    handleSend,
    toValues,
    ccValues,
    subject,
    setSubject,
    setToValues,
    setCcValues,
  }: any) => (
    <div>
      <div>EmailEditor</div>
      <button
        onClick={() => {
          setToValues([{ label: "Test User", value: "test@example.com" }]);
          setCcValues([{ label: "CC User", value: "cc@example.com" }]);
          setSubject("Test Subject");
          handleSend("<p>This is test email</p>");
        }}
      >
        Send
      </button>
    </div>
  ),
}));

const mockAccount = {
  id: "acc-1",
  name: "Sender Name",
  emailAddress: "sender@example.com",
};

const renderWithProviders = (isCollapsed: boolean = false) => {
  const accountAtom = atom(mockAccount);

  return render(
    <TooltipProvider>
      <JotaiProvider initialValues={[[accountDetails, accountAtom]]}>
        <ComposeEmailButton isCollapsed={isCollapsed} />
      </JotaiProvider>
    </TooltipProvider>,
  );
};

describe("ComposeEmailButton", () => {
  it("renders collapsed button with only icon", () => {
    renderWithProviders(true);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByText("Compose")).not.toBeInTheDocument();
  });

  it("renders expanded button with text", () => {
    renderWithProviders(false);
    expect(screen.getByText("Compose")).toBeInTheDocument();
  });

  it("opens the sheet and sends email", async () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole("button")); // Open sheet
    expect(await screen.findByText("EmailEditor")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Send")); // Trigger mocked send

    await waitFor(() => {
      expect(require("sonner").toast.success).toHaveBeenCalledWith(
        "Email sent",
      );
    });
  });
});
