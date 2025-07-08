/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react-hooks";
import useThreads from "@/app/mail/hooks/useThreads"; // adjust path as needed
import { useLocalStorage } from "usehooks-ts";
import { useSetAtom, useAtomValue } from "jotai";

// Mocks
jest.mock("usehooks-ts", () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock("jotai", () => {
  const actual = jest.requireActual("jotai");
  return {
    ...actual,
    useSetAtom: jest.fn(),
    useAtomValue: jest.fn(),
  };
});

jest.mock("@/trpc/react", () => ({
  api: {
    account: {
      getThreads: {
        useQuery: jest.fn(),
      },
      searchEmail: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Import mocked functions after mocking
import { api } from "@/trpc/react";

describe("useThreads", () => {
  const mockUseLocalStorage = useLocalStorage as jest.Mock;
  const mockUseSetAtom = useSetAtom as jest.Mock;
  const mockUseAtomValue = useAtomValue as jest.Mock;

  const mockSetThreads = jest.fn();
  const mockSetSearching = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSetAtom.mockImplementation((atom) => {
      return atom.name === "threadsListAtom"
        ? mockSetThreads
        : mockSetSearching;
    });
    mockUseAtomValue.mockReturnValue({ email: "test@example.com" });
    mockUseLocalStorage.mockImplementation(
      (key: string, defaultValue: string) => {
        if (key === "accountId") return ["test-account-id"];
        if (key === "email-tabs") return ["inbox"];
        return [defaultValue];
      },
    );
  });

  it("fetches regular threads when no search item is provided", () => {
    const refetch = jest.fn();
    const threads = [{ id: "1", subject: "Test Thread" }];
    (api.account.getThreads.useQuery as jest.Mock).mockReturnValue({
      data: { threads, totalPages: 2 },
      isFetching: false,
      refetch,
    });

    const { result } = renderHook(() =>
      useThreads({ page: 1, done: false, searchItem: "" }),
    );

    expect(result.current.threads).toEqual(threads);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.accountId).toBe("test-account-id");
  });

  it("triggers search mutation and sets results", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({
      results: [{ id: "2", subject: "Searched Thread" }],
      totalPages: 3,
    });

    const mutation = {
      mutateAsync,
      isPending: false,
    };

    (api.account.getThreads.useQuery as jest.Mock).mockReturnValue({
      data: { threads: [], totalPages: 1 },
      isFetching: false,
      refetch: jest.fn(),
    });

    (api.account.searchEmail.useMutation as jest.Mock).mockReturnValue(
      mutation,
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useThreads({ page: 1, done: false, searchItem: "search" }),
    );

    // simulate mutation resolving
    await waitForNextUpdate();

    expect(mutateAsync).toHaveBeenCalledWith({
      accountId: "test-account-id",
      query: "search",
      page: 1,
      pageSize: 5,
    });

    expect(result.current.threads).toEqual([
      { id: "2", subject: "Searched Thread" },
    ]);
    expect(result.current.totalPages).toBe(3);
  });
});
