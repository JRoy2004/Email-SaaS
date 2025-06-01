"use server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { auth } from "@clerk/nextjs/server";
import type { EmailMessage } from "@/types";
import { updatedeltaToken, syncEmailToDatabase } from "./sync-to-db";

export const updateEmail = async (accountId: string): Promise<void> => {
  // Helper function for consistent error logging
  const logError = (message: string, error?: unknown) => {
    console.error(`[Email Sync Error] ${message}`, error ?? "");
  };

  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized: No user ID found");
    }

    // 2. Validate account ID
    if (!accountId || typeof accountId !== "string") {
      throw new Error(`Invalid account ID: ${accountId}`);
    }

    // 3. Get email account details
    const emailAccount = await getEmailAddressFromAccountId(accountId);
    if (!emailAccount?.accessToken) {
      throw new Error("Email account not found or missing access token");
    }

    // 4. Initialize account and perform sync
    const dbAccount = new Account(emailAccount.accessToken);
    let syncResult: { emails: EmailMessage[]; deltaToken: string } | undefined;

    try {
      if (!emailAccount.nextDeltaToken) {
        console.log("Performing  sync...");
        syncResult = await dbAccount.performInitialSync();
      } else {
        syncResult = await dbAccount.getEmailDeltaToken(
          emailAccount.nextDeltaToken,
        );
      }
    } catch (syncError) {
      throw new Error(
        `Sync operation failed: ${syncError instanceof Error ? syncError.message : "Unknown sync error"}`,
      );
    }

    // 5. Validate sync result
    if (!syncResult?.deltaToken) {
      throw new Error("Invalid sync result: Missing delta token");
    }
    const emailCount = syncResult.emails?.length || 0;
    console.log(`Sync completed. Found ${emailCount} new emails.`);

    if (emailCount > 0) {
      // 6. Process emails
      try {
        await syncEmailToDatabase(syncResult.emails, accountId);
        console.log(`Successfully stored ${emailCount} emails`);
      } catch (dbError) {
        throw new Error(
          `Failed to store emails: ${dbError instanceof Error ? dbError.message : "Database error"}`,
        );
      }
    }
    // 7. Update delta token
    try {
      await updatedeltaToken(syncResult.deltaToken, accountId);
      // console.log("Delta token updated successfully");
    } catch (tokenError) {
      throw new Error(
        `Failed to update delta token: ${tokenError instanceof Error ? tokenError.message : "Token update error"}`,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logError(`Account ${accountId}: ${errorMessage}`, error);
    // Re-throw to allow calling code to handle the error
    throw error;
  } finally {
    // console.log(`Email sync process completed for account: ${accountId}`);
  }
};

async function getUserAccounts(userId: string) {
  const userWithAccounts = await db.user.findUnique({
    where: { id: userId },
    include: { accounts: true }, // Include related accounts
  });

  if (!userWithAccounts) {
    console.log("User not found");
    return null;
  }

  return userWithAccounts.accounts; // Return only the accounts
}

async function getEmailAddressFromAccountId(accountId: string): Promise<{
  emailAddress: string;
  accessToken: string;
  nextDeltaToken: string | null;
} | null> {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { emailAddress: true, accessToken: true, nextDeltaToken: true }, // Select only the emailAddress field
  });

  if (!account) {
    console.log("Account not found");
    return null;
  }

  return account; // Return the emailAddress
}
