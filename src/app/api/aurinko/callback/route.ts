import { waitUntil } from "@vercel/functions";
import {
  exchangeCodeForAccessToken,
  getAccountDetails,
  getAccountInfo,
} from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";

export const GET = async (req: NextRequest) => {
  console.log("Callback route hit");
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const status = params.get("status");

  console.log("STATUS\n", status);

  if (status != "success")
    return NextResponse.json(
      { message: "Failed to link account" },
      { status: 400 },
    );

  // get the code to exchange for the access token
  const code = params.get("code")?.trim();

  console.log("CODE\n", code);
  if (!code)
    return NextResponse.json({ message: "No code Provided" }, { status: 400 });
  const token = await exchangeCodeForAccessToken(code);

  console.log("TOKEN\n", token);
  if (!token)
    return NextResponse.json(
      { message: "Failed to exchange code for access token" },
      { status: 400 },
    );
  const accountDetails = await getAccountDetails(token.accessToken);

  // const accountDetails = await getAccountInfo(token.accountId);
  console.log("ACCOUNT DETAILS\n", accountDetails);

  await db.account.upsert({
    where: { id: token.accountId.toString() },
    update: { accessToken: token.accessToken },
    create: {
      id: token.accountId.toString(),
      userId,
      accessToken: token.accessToken,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
  });

  // trigger initial sync end-point
  waitUntil(
    axios
      .post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
        accountId: token.accountId.toString(),
        userId,
      })
      .then((response) => {
        console.log("Initial sync triggered successfully", response.data);
      })
      .catch((err) => {
        console.error("Failed to trigger initial sync", err);
      }),
  );

  return NextResponse.redirect(new URL("/mail", req.url));
};
