"use server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { syncEmailToDatabase, updatedeltaToken } from "@/lib/sync-to-db";

export const POST = async (req: NextRequest) => {
  const { accountId, userId } = (await req.json()) as {
    accountId: string;
    userId: string;
  };
  if (!accountId || !userId) {
    return NextResponse.json(
      { message: "Invalid request", error: "Missing accountId or userId" },
      { status: 400 },
    );
  }

  const dbAccount = await db.account.findUnique({
    where: { id: accountId, userId },
  });
  if (!dbAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const account = new Account(dbAccount.accessToken);
  const response = await account.performInitialSync();
  if (!response)
    return NextResponse.json(
      { error: "Failed to perform initial sync" },
      { status: 500 },
    );
  const { emails, deltaToken } = response;
  // console.log(emails);

  await updatedeltaToken(deltaToken, accountId);

  await syncEmailToDatabase(emails, accountId);

  return new Response(JSON.stringify({ message: "Email received", emails }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
