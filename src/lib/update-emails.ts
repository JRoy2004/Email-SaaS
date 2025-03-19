"use server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { auth } from "@clerk/nextjs/server";
import type { EmailMessage } from "@/types";
import { updatedeltaToken, syncEmailToDatabase } from "./sync-to-db";
export const updateEmail = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");
  const accounts = await getUserAccounts(userId);
  if (!accounts) return;

  const accountId = accounts[0]?.id ?? "";
  if (!accountId) return;
  const email = await getEmailAddressFromAccountId(accountId);
  if (!email) return;

  const dbAccount = new Account(email.accessToken);
  let res: { emails: EmailMessage[]; deltaToken: string } | undefined;
  if (!email.nextDeltaToken) res = await dbAccount.performInitialSync();
  else res = await dbAccount.getEmailDeltaToken(email.nextDeltaToken);
  if (!res?.deltaToken) return;

  await syncEmailToDatabase(res?.emails, accountId);
  await updatedeltaToken(res?.deltaToken, accountId);
  console.log("UPDATE EMAILS", res?.emails);
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
