"use client"; // Ensure this runs on the client side
import { updateEmail } from "@/lib/update-emails";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const GetNewEmails = () => {
  const router = useRouter();

  return (
    <div>
      <Button
        onClick={async () => {
          await updateEmail();
          router.push("/mail"); // Navigate to the mail page
        }}
      >
        Get New Emails
      </Button>
    </div>
  );
};

export default GetNewEmails;
