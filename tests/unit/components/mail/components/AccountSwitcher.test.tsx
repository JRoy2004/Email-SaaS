/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountSwitcher from "@/app/mail/components/account-switcher";
import { useLocalStorage } from "usehooks-ts";
import { useSetAtom } from "jotai";

// Mock modules
jest.mock("usehooks-ts", () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useSetAtom: jest.fn(),
  };
});

jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      getAccounts: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock("@/components/add-account.tsx", () => () => (
  <div data-testid="add-account">AddAccount</div>
));

import { api } from "@/trpc/react";

describe("AccountSwitcher", () => {
  const mockUseLocalStorage = useLocalStorage as jest.Mock;
  const mockUseSetAtom = useSetAtom as jest.Mock;
  const setAccountId = jest.fn();
  const setAccountInfo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalStorage.mockImplementation(
      (key: string, defaultVal: string) => {
        if (key === "accountId") return ["acc-1", setAccountId];
        return [defaultVal, jest.fn()];
      },
    );

    mockUseSetAtom.mockReturnValue(setAccountInfo);
  });

  it("renders AddAccount if no accounts available", () => {
    (api.account.getAccounts.useQuery as jest.Mock).mockReturnValue({
      data: [],
    });

    render(<AccountSwitcher isCollapsed={false} />);
    expect(screen.getByTestId("add-account")).toBeInTheDocument();
  });

  it("renders account dropdown with correct values", () => {
    const accounts = [
      { id: "acc-1", name: "Account One", emailAddress: "one@mail.com" },
      { id: "acc-2", name: "Account Two", emailAddress: "two@mail.com" },
    ];

    (api.account.getAccounts.useQuery as jest.Mock).mockReturnValue({
      data: accounts,
    });

    render(<AccountSwitcher isCollapsed={false} />);

    expect(screen.getByText("Account One")).toBeInTheDocument();
    expect(screen.getByText("O")).toBeInTheDocument(); // First letter of email
  });
});
