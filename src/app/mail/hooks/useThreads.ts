import { api } from "@/trpc/react";
import { useSetAtom, useAtomValue } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import {
  threadsListAtom,
  accountDetails,
  searchingAtom,
  type Thread,
} from "../atoms";
import { useEffect, useState } from "react";

interface Props {
  page: number;
  done: boolean;
  searchItem: string;
}

const useThreads = ({ page, done, searchItem }: Props) => {
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("email-tabs", "inbox");
  const setThreadList = useSetAtom(threadsListAtom);
  const accountInfo = useAtomValue(accountDetails);

  const setIsSearching = useSetAtom(searchingAtom);
  const pageSize = 5;

  // Store search results separately
  const [searchResults, setSearchResults] = useState<{
    threads: Thread[];
    totalPages: number;
  }>({ threads: [], totalPages: 1 });

  // Regular threads query
  const regularQuery = api.account.getThreads.useQuery(
    {
      accountId,
      tab,
      done,
      pageSize,
      page,
    },
    {
      enabled: !!accountId && !!tab && searchItem === "",
      placeholderData: (e) => e,
    },
  );

  // Search mutation
  const searchMutation = api.account.searchEmail.useMutation();

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId) return;

      if (searchItem.trim()) {
        try {
          const result = await searchMutation.mutateAsync({
            accountId,
            query: searchItem,
            page,
            pageSize,
          });

          setSearchResults({
            threads: result.results,
            totalPages: result.totalPages,
          });
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setSearchResults({ threads: [], totalPages: 1 });
      }
    };

    void fetchData();
  }, [searchItem, page, accountId]);

  // Determine which data to use
  const activeData = searchItem.trim() ? searchResults : regularQuery.data;
  const isFetching = searchItem.trim()
    ? searchMutation.isPending
    : regularQuery.isFetching;

  useEffect(() => {
    if (activeData?.threads) {
      setThreadList(activeData.threads);
      setIsSearching(false);
    }
  }, [activeData?.threads]);

  return {
    threads: activeData?.threads ?? [],
    totalPages: activeData?.totalPages ?? 1,
    isFetching,
    refetch: regularQuery.refetch,
    accountId,
    account: accountInfo,
  };
};

export default useThreads;
