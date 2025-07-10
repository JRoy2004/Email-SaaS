import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TagInput from "@/app/mail/components/email-editor/tag-input";
import { useLocalStorage } from "usehooks-ts";
import { useAtomValue } from "jotai";
import userEvent from "@testing-library/user-event";

jest.mock("usehooks-ts", () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useAtomValue: jest.fn(),
  };
});

jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      getSuggestions: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe("TagInput", () => {
  const mockUseLocalStorage = useLocalStorage as jest.Mock;
  const mockUseAtomValue = useAtomValue as jest.Mock;
  const mockUseQuery =
    require("@/trpc/react").api.account.getSuggestions.useQuery;

  const mockOnChange = jest.fn();

  const emailSuggestions = [
    { name: "John Doe", address: "john@example.com" },
    { name: "Jane Smith", address: "jane@example.com" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocalStorage.mockReturnValue(["acc-1"]);
    mockUseAtomValue.mockReturnValue({ emailAddress: "me@example.com" });

    mockUseQuery.mockReturnValue({
      data: { emailAddresses: emailSuggestions },
    });
  });

  it("renders with label and placeholder", () => {
    render(
      <TagInput
        placeholder="Type to add emails"
        label="To"
        onChange={mockOnChange}
        values={[]}
      />,
    );

    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Type to add emails")).toBeInTheDocument();
  });

  it("filters out current user's email and renders options", async () => {
    render(
      <TagInput
        placeholder="Add recipient"
        label="To"
        onChange={mockOnChange}
        values={[]}
      />,
    );

    const input = screen.getByText("Add recipient");

    // Simulate user clicking the input to trigger dropdown
    await userEvent.click(input);

    expect(screen.queryByText("me@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows selected values with custom styling", () => {
    render(
      <TagInput
        placeholder="Add recipient"
        label="To"
        onChange={mockOnChange}
        values={[{ label: "John Doe", value: "john@example.com" }]}
      />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("appends typed input as new option", async () => {
    render(
      <TagInput
        placeholder="Add recipient"
        label="To"
        onChange={mockOnChange}
        values={[]}
      />,
    );

    const input = screen.getByRole("combobox");

    // Type the new email
    await userEvent.type(input, "new@mail.com");

    // Assert that the typed value appears as a selectable option
    const matches = await screen.findAllByText("new@mail.com");
    expect(matches).toHaveLength(2);
  });
});
