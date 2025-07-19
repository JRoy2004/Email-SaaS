import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GetNewEmails from "@/components/get-new-emails";
import { updateEmail } from "@/lib/update-emails";

// Mock the updateEmail function
jest.mock("@/lib/update-emails", () => ({
  updateEmail: jest.fn(),
}));

describe("GetNewEmails component", () => {
  const mockAccountId = "test-account-id";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the reload button", () => {
    render(<GetNewEmails accountId={mockAccountId} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls updateEmail with correct accountId on click", async () => {
    render(<GetNewEmails accountId={mockAccountId} />);
    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(updateEmail).toHaveBeenCalledTimes(1);
    expect(updateEmail).toHaveBeenCalledWith(mockAccountId);
  });
});
