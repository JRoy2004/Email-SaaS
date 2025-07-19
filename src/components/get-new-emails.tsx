"use client"; // Ensure this runs on the client side
import { updateEmail } from "@/lib/update-emails";
import React from "react";
import { Button } from "./ui/button";
import { TfiReload } from "react-icons/tfi";
// import { useRouter } from "next/navigation";

const GetNewEmails = ({ accountId }: { accountId: string }) => {
  // const router = useRouter();

  return (
    <div className="p-4">
      <Button
        onClick={async () => {
          await updateEmail(accountId);
        }}
        variant="secondary"
      >
        <TfiReload />
      </Button>
    </div>
  );
};

export default GetNewEmails;
