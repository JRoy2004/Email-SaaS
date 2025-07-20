import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchBar from "@/app/mail/components/search-bar";
import { Provider as JotaiProvider, atom } from "jotai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { searchingAtom, searchValueAtom } from "@/app/mail/atoms";
import React from "react";

jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"),
  Loader2: () => <div data-testid="mock-loader">Loading...</div>,
}));

// Provide a custom wrapper for Jotai and TooltipProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <JotaiProvider>
      <TooltipProvider>{ui}</TooltipProvider>
    </JotaiProvider>,
  );
};

describe("SearchBar", () => {
  test("renders input field", () => {
    renderWithProviders(<SearchBar />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  test("typing triggers input after debounce", async () => {
    renderWithProviders(<SearchBar />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    await waitFor(
      () => {
        expect(input).not.toHaveValue("");
      },
      { timeout: 600 }, // account for debounce delay
    );
  });

  test("clicking clear (X) button resets input ", async () => {
    renderWithProviders(<SearchBar />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
  });

  test("focus and blur behavior", () => {
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText("Search");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "focused text" } });

    expect(input).toHaveValue("focused text");

    fireEvent.blur(input);
    expect(input).toHaveValue("focused text"); // value should persist
  });
});
