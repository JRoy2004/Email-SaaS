"use server";
import axios from "axios";
import { auth } from "@clerk/nextjs/server";

export const getAurinkoAuthUrl = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID!,
    serviceType,
    scopes: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
  });
  // console.log(params);
  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};

export const exchangeCodeForAccessToken = async (code: string) => {
  const url = `https://api.aurinko.io/v1/auth/token/${code}`;
  try {
    const response = await axios.post(url, null, {
      auth: {
        username: process.env.AURINKO_CLIENT_ID!,
        password: process.env.AURINKO_CLIENT_SECRET!,
      },
    });
    return response.data as {
      accountId: number;
      accessToken: string;
      UserId: string;
      userSession: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
    }
    console.error(error);
  }
};

export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get(`https://api.aurinko.io/v1/account`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const rec = response.data as {
      email: "string";
      mailboxAddress: "string";
      name: "string";
      name2: "string";
      userId: "string";
    };
    return rec;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account details: ", error.response?.data);
    }
    console.error("Unexpected error fetching account details: ", error);
    throw error;
  }
};

export const getAccountInfo = async (id: number) => {
  try {
    const url = `https://api.aurinko.io/v1/am/accounts/${id}`;
    const response = await axios.get(url, {
      auth: {
        username: process.env.AURINKO_CLIENT_ID!,
        password: process.env.AURINKO_CLIENT_SECRET!,
      },
    });
    const rec = response.data as {
      email: "string";
      mailboxAddress: "string";
      name: "string";
      name2: "string";
      userId: "string";
    };
    return rec;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account by id:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
};
