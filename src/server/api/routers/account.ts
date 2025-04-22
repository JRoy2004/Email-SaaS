import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

const authoriseAccountAccess = async (accountId: string, userId: string) => {
  const account = await db.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, emailAddress: true, accessToken: true, name: true },
  });
  if (!account) throw new Error("Account not found");
  return account;
};

export const accountRouter = createTRPCRouter({
  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      select: {
        id: true,
        emailAddress: true,
        name: true,
      },
    });
  }),
  getThreadsCount: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      // Correct use of Prisma's raw query
      const result = await ctx.db.$queryRaw<
        {
          inboxStatusTrue: number;
          draftStatusTrue: number;
          sentStatusTrue: number;
          trashStatusTrue: number;
          junkStatusTrue: number;
        }[]
      >`
    SELECT 
      SUM(CASE WHEN "inboxStatus" = true THEN 1 ELSE 0 END) AS "inboxStatusTrue", 
      SUM(CASE WHEN "draftStatus" = true THEN 1 ELSE 0 END) AS "draftStatusTrue",
      SUM(CASE WHEN "sentStatus" = true THEN 1 ELSE 0 END) AS "sentStatusTrue",
      SUM(CASE WHEN "trashStatus" = true THEN 1 ELSE 0 END) AS "trashStatusTrue",
      SUM(CASE WHEN "junkStatus" = true THEN 1 ELSE 0 END) AS "junkStatusTrue"
    FROM "Thread" 
    WHERE "accountId" = ${account.id};`;

      // Ensure returning result
      return (
        result[0] ?? {
          inboxStatusTrue: 0,
          draftStatusTrue: 0,
          sentStatusTrue: 0,
          trashStatusTrue: 0,
          junkStatusTrue: 0,
        }
      );
    }),
  getThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(15),
        tab: z.string().default("inbox"),
        done: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      let filter: Prisma.ThreadWhereInput = {};
      filter = {
        ...filter,
        accountId: account.id,
        done: input.done,
        inboxStatus: input.tab === "inbox",
        draftStatus: input.tab === "draft",
        sentStatus: input.tab === "sent",
        junkStatus: input.tab === "junk",
        trashStatus: input.tab === "trash",
      };
      const totalThreads = await ctx.db.thread.count({
        where: filter,
      });
      const threads = await ctx.db.thread.findMany({
        where: filter,
        include: {
          emails: {
            orderBy: {
              sentAt: "asc",
            },
            select: {
              from: true,
              body: true,
              bodySnippet: true,
              emailLabel: true,
              subject: true,
              sysLabels: true,
              sysClassifications: true,
              id: true,
              sentAt: true,
            },
          },
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
        orderBy: { lastMessageDate: "desc" },
      });
      return {
        threads,
        totalPages: Math.ceil(totalThreads / input.pageSize),
      };
    }),
  getSuggestions: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      return await ctx.db.account.findFirst({
        where: {
          id: account.id,
        },
        select: {
          emailAddresses: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
    }),
  getReplyDetails: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(["reply", "replyAll"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );
      const thread = await ctx.db.thread.findFirst({
        where: {
          id: input.threadId,
        },
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
              sentAt: true,
              subject: true,
              internetMessageId: true,
            },
          },
        },
      });

      if (!thread || thread.emails.length === 0)
        throw new Error("Thread not Found");
      const lastExternalEmail = thread.emails
        .reverse()
        .find((email) => email.from.address !== account.emailAddress);

      if (!lastExternalEmail)
        throw new Error("No External email found in Thread");

      // const allRecipients = new Set([
      //   ...thread.emails.flatMap((e) => [e.from, ...e.to, ...e.cc]),
      // ]);

      if (input.replyType === "reply") {
        return {
          to: [lastExternalEmail.from],
          cc: [],
          from: { name: account.name, address: account.emailAddress },
          subject: `${lastExternalEmail.subject}`,
          id: lastExternalEmail.internetMessageId,
        };
      } else if (input.replyType === "replyAll") {
        return {
          to: [
            lastExternalEmail.from,
            ...lastExternalEmail.to.filter((addr) => addr.id !== account.id),
          ],
          cc: lastExternalEmail.cc.filter((addr) => addr.id !== account.id),
          from: { name: account.name, address: account.emailAddress },
          subject: `${lastExternalEmail.subject}`,
          id: lastExternalEmail.internetMessageId,
        };
      }
    }),
});
