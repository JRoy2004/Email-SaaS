import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/aurinko", () => ({
  getAurinkoAuthUrl: jest.fn(
    (accountType) => "https://api.aurinko.io/v1/auth/authorize",
  ),
}));
import LinkAccountButton from "@/components/link-account-button";

describe("LinkAccountButton", () => {
  it("renders with children", () => {
    render(
      <LinkAccountButton accountType="Google">Link Google</LinkAccountButton>,
    );
    expect(screen.getByText("Link Google")).toBeInTheDocument();
  });

  it("applies Google styles when accountType is Google", () => {
    render(<LinkAccountButton accountType="Google">Google</LinkAccountButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-[#EA4335]");
    expect(button).toHaveClass("text-white");
  });

  it("applies Office365 styles when accountType is Office365", () => {
    render(
      <LinkAccountButton accountType="Office365">Office</LinkAccountButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-[#0072C6]");
    expect(button).toHaveClass("text-white");
  });
});
