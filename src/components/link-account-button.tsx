"use client";
import { getAurinkoAuthUrl } from "@/lib/aurinko";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

interface LinkAccountButtonProps {
  children: ReactNode;
  accountType: "Google" | "Office365";
}

const LinkAccountButton = ({
  children,
  accountType,
}: LinkAccountButtonProps) => {
  return (
    <Button
      className={`${accountType === "Google" ? "bg-[#EA4335] text-white hover:bg-[#D93025]" : "bg-[#0072C6] text-white hover:bg-[#005A9E]"} w-full`}
      onClick={async () => {
        const authUrl = await getAurinkoAuthUrl(accountType);
        window.location.href = authUrl;
      }}
    >
      {children}
    </Button>
  );
};

export default LinkAccountButton;
