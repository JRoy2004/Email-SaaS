import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddAccount from "@/components/add-account";

type prop = {
  children: React.ReactNode;
  className: string;
};

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(() => ({ userId: "mock-user-id" })),
}));

jest.mock("@/components/ui/menubar", () => ({
  Menubar: ({ children, className }: prop) => (
    <div className={`menubar ${className}`}>{children}</div>
  ),
  MenubarContent: ({ children, className }: prop) => (
    <div className={`menubar-content ${className}`}>{children}</div>
  ),
  MenubarItem: ({ children, className }: prop) => (
    <div className={`menubar-item ${className}`}>{children}</div>
  ),
  MenubarMenu: ({ children }: { children: React.ReactNode }) => (
    <div className="menubar-menu">{children}</div>
  ),
  MenubarSeparator: () => <div className="menubar-separator" />,
  MenubarTrigger: ({ children, className }: prop) => (
    <button className={`menubar-trigger ${className}`}>{children}</button>
  ),
}));

describe("AddAccount Component", () => {
  test("renders Add New Account trigger button", () => {
    render(<AddAccount />);
    expect(screen.getByText(/Add New Account/i)).toBeInTheDocument();
  });

  test("shows account options after clicking Add New Account", async () => {
    render(<AddAccount />);

    const trigger = screen.getByText("Add New Account");
    fireEvent.click(trigger);

    await waitFor(
      () => {
        const outlookButton = screen.getByText(/outlook/i);
        const googleButton = screen.getByText("Google");

        expect(googleButton).toBeInTheDocument();
        expect(outlookButton).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
  test("Google button contains correct text", async () => {
    render(<AddAccount />);
    fireEvent.click(screen.getByText(/Add New Account/i));

    const googleButton = await screen.findByText(/Google/i);
    expect(googleButton).toBeInTheDocument();
  });

  test("Outlook button contains correct text", async () => {
    render(<AddAccount />);
    fireEvent.click(screen.getByText(/Add New Account/i));

    const outlookButton = await screen.findByText(/Outlook/i);
    expect(outlookButton).toBeInTheDocument();
  });
});
