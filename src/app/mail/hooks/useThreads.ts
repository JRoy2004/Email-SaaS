import { api } from "@/trpc/react";
import { useSetAtom, useAtomValue } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import { threadsListAtom, accountDetails } from "../atoms";
import { useEffect } from "react";

interface props {
  page: number;
  done: boolean;
}

const useThreads = ({ page, done }: props) => {
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("email-tabs", "inbox");
  // const [done] = useLocalStorage<boolean>("email-done", false);
  const setThreadList = useSetAtom(threadsListAtom);
  const accountInfo = useAtomValue(accountDetails);
  const pageSize = 10;
  // console.log(page);
  const { data, isFetching, refetch } = api.account.getThreads.useQuery(
    {
      accountId,
      tab,
      done,
      pageSize,
      page,
    },
    {
      enabled: !!accountId && !!tab,
      placeholderData: (e) => e,
      // refetchInterval: 5000,
    },
  );

  useEffect(() => {
    if (data?.threads) {
      setThreadList(data.threads);
    }
  }, [data?.threads, setThreadList]);

  return {
    threads: data?.threads ?? [],
    totalPages: data?.totalPages ?? 1,
    isFetching: isFetching,
    refetch,
    accountId,
    account: accountInfo,
  };
};

export default useThreads;
