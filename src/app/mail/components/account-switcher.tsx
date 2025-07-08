"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

import { useEffect } from "react";

import { useLocalStorage } from "usehooks-ts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddAccount from "@/components/AddAccount";
import { useAtomValue, useSetAtom } from "jotai";
import { accountDetails } from "../atoms";

interface AccountSwitcherProps {
  isCollapsed: boolean;
}

const AccountSwitcher = ({ isCollapsed }: AccountSwitcherProps) => {
  const { data: accounts } = api.account.getAccounts.useQuery();

  const [accountId, setAccountId] = useLocalStorage("accountId", "");
  const setAccountInfo = useSetAtom(accountDetails);

  const handelChange = (accountId: string) => {
    const accountInfo = accounts?.find((account) => account.id === accountId);
    setAccountId(accountId);
    console.log(accountInfo, "####");
    setAccountInfo(accountInfo ?? null);
  };

  useEffect(() => {
    if (accounts && accounts.length > 0 && accountId) {
      const initialAccountInfo = accounts.find(
        (account) => account.id === accountId,
      );
      console.log(initialAccountInfo);
      if (initialAccountInfo) {
        setAccountInfo(initialAccountInfo);
      }
    } else if (accounts && accounts.length > 0 && !accountId) {
      // Optionally set a default account if no accountId in localStorage
      handelChange(accounts[0]!.id);
    }
  });

  if (!accounts || accounts.length === 0) return <AddAccount />;

  // console.log(accountId);

  return (
    <Select defaultValue={accountId} onValueChange={handelChange}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {/* {accounts.find((account) => account.emailAddress === selectedAccount)?.icon} */}
          <span className={cn(isCollapsed || "hidden")}>
            {accounts
              .find((account) => account.id === accountId)
              ?.emailAddress[0]?.toUpperCase()}
          </span>
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {accounts.find((account) => account.id === accountId)?.name}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {/* {account.icon} */}
              {account.emailAddress}
            </div>
          </SelectItem>
        ))}
        <div className="w-full">
          <AddAccount />
        </div>
      </SelectContent>
    </Select>
  );
};

export default AccountSwitcher;
