import pLimit from "p-limit";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { EmailAddress, EmailAttachment, EmailMessage } from "@/types";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { OramaClient } from "./orama";
import { getPlainText } from "@/utils/getPlainText";

export async function syncEmailToDatabase(
  emails: EmailMessage[],
  accountId: string,
) {
  console.log(`Attempting to sync ${emails.length} emails to database.`);
  const limit = pLimit(20);
  const oramaDB = new OramaClient(accountId);
  await oramaDB.initialize();

  try {
    await Promise.all(
      emails.map((email, index) =>
        limit(async () => {
          await upsertEmail(email, accountId, index);

          // Build the document in the shape expected by Orama
          const emailDoc = {
            subject: email.subject || "",
            body: email.bodySnippet ?? getPlainText(email.body ?? ""),
            from: `${email.from.name} <${email.from.address}>`,
            to: email.to.map((t) => `${t.name} <${t.address}>`),
            sentAt: email.sentAt,
            threadId: email.threadId,
          };

          await oramaDB.insert(emailDoc);
        }),
      ),
    );
  } catch (error) {
    console.log(`Failed to sync emails to database`, error);
  }
}

async function upsertEmail(
  email: EmailMessage,
  accountId: string,
  index: number,
) {
  console.log(`Upserting email ${index + 1}`);
  console.log(email);

  try {
    let emailLabelType:
      | "junk"
      | "trash"
      | "sent"
      | "inbox"
      | "unread"
      | "flagged"
      | "important"
      | "draft" = "inbox";
    if (
      email.sysLabels.includes("inbox") ||
      email.sysLabels.includes("important")
    )
      emailLabelType = "inbox";
    else if (email.sysLabels.includes("trash")) emailLabelType = "trash";
    else if (email.sysLabels.includes("junk")) emailLabelType = "junk";
    else if (email.sysLabels.includes("sent")) emailLabelType = "sent";
    else if (email.sysLabels.includes("draft")) emailLabelType = "draft";

    // 1. Upsert EmailAddress records
    const addressesToUpsert = new Set<EmailAddress>();
    for (const address of [
      email.from,
      ...email.to,
      ...email.cc,
      ...email.bcc,
      ...email.replyTo,
    ]) {
      addressesToUpsert.add(address);
    }

    const upsertedAddresses: (Awaited<
      ReturnType<typeof upsertEmailAddress>
    > | null)[] = [];

    for (const address of addressesToUpsert) {
      const upsertedAddress = await upsertEmailAddress(address, accountId);
      upsertedAddresses.push(upsertedAddress);
    }

    const addressMap = new Map(
      upsertedAddresses
        .filter(Boolean)
        .map((address) => [address!.address, address]),
    );

    const fromAddress = addressMap.get(email.from.address);
    if (!fromAddress) {
      console.log(
        `Failed to upsert from address for email ${email.bodySnippet}`,
      );
      return;
    }

    const toAddresses = email.to
      .map((addr) => addressMap.get(addr.address))
      .filter(Boolean);
    const ccAddresses = email.cc
      .map((addr) => addressMap.get(addr.address))
      .filter(Boolean);
    const bccAddresses = email.bcc
      .map((addr) => addressMap.get(addr.address))
      .filter(Boolean);
    const replyToAddresses = email.replyTo
      .map((addr) => addressMap.get(addr.address))
      .filter(Boolean);

    const oldThread = await db.thread.findUnique({
      where: { id: email.threadId },
    });

    const thread = await db.thread.upsert({
      where: { id: email.threadId },
      update: {
        subject: email.subject,
        accountId,
        lastMessageDate: new Date(email.sentAt),
        done: false,
        draftStatus: emailLabelType === "draft",
        inboxStatus: emailLabelType === "inbox",
        sentStatus: emailLabelType === "sent",
        participantIds: [
          ...new Set([
            fromAddress.id,
            ...toAddresses.map((a) => a!.id),
            ...ccAddresses.map((a) => a!.id),
            ...bccAddresses.map((a) => a!.id),
          ]),
        ],
      },
      create: {
        id: email.threadId,
        accountId,
        subject: email.subject,
        done: false,
        draftStatus: emailLabelType === "draft",
        inboxStatus: emailLabelType === "inbox",
        sentStatus: emailLabelType === "sent",
        trashStatus: emailLabelType === "trash",
        junkStatus: emailLabelType === "junk",
        lastMessageDate: new Date(email.sentAt),
        participantIds: [
          ...new Set([
            fromAddress.id,
            ...toAddresses.map((a) => a!.id),
            ...ccAddresses.map((a) => a!.id),
            ...bccAddresses.map((a) => a!.id),
          ]),
        ],
      },
    });

    // 3. Upsert Email
    await db.email.upsert({
      where: { id: email.id },
      update: {
        threadId: thread.id,
        createdTime: new Date(email.createdTime),
        lastModifiedTime: new Date(),
        sentAt: new Date(email.sentAt),
        receivedAt: new Date(email.receivedAt),
        internetMessageId: email.internetMessageId,
        subject: email.subject,
        sysLabels: email.sysLabels,
        keywords: email.keywords,
        sysClassifications: email.sysClassifications,
        sensitivity: email.sensitivity,
        meetingMessageMethod: email.meetingMessageMethod,
        fromId: fromAddress.id,
        to: { set: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { set: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { set: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { set: replyToAddresses.map((a) => ({ id: a!.id })) },
        hasAttachments: email.hasAttachments,
        internetHeaders: email.internetHeaders as {
          name: "string";
          value: "string";
        }[],
        body: email.body,
        bodySnippet: email.bodySnippet,
        inReplyTo: email.inReplyTo,
        references: email.references,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties as InputJsonValue,
        folderId: email.folderId,
        omitted: email.omitted,
        emailLabel: emailLabelType,
      },
      create: {
        id: email.id,
        emailLabel: emailLabelType,
        threadId: thread.id,
        createdTime: new Date(email.createdTime),
        lastModifiedTime: new Date(),
        sentAt: new Date(email.sentAt),
        receivedAt: new Date(email.receivedAt),
        internetMessageId: email.internetMessageId,
        subject: email.subject,
        sysLabels: email.sysLabels,
        internetHeaders: email.internetHeaders as {
          name: "string";
          value: "string";
        }[],
        keywords: email.keywords,
        sysClassifications: email.sysClassifications,
        sensitivity: email.sensitivity,
        meetingMessageMethod: email.meetingMessageMethod,
        fromId: fromAddress.id,
        to: { connect: toAddresses.map((a) => ({ id: a!.id })) },
        cc: { connect: ccAddresses.map((a) => ({ id: a!.id })) },
        bcc: { connect: bccAddresses.map((a) => ({ id: a!.id })) },
        replyTo: { connect: replyToAddresses.map((a) => ({ id: a!.id })) },
        hasAttachments: email.hasAttachments,
        body: email.body,
        bodySnippet: email.bodySnippet,
        inReplyTo: email.inReplyTo,
        references: email.references,
        threadIndex: email.threadIndex,
        nativeProperties: email.nativeProperties as InputJsonValue,
        folderId: email.folderId,
        omitted: email.omitted,
      },
    });

    if (oldThread) {
      const threadEmails = await db.email.findMany({
        where: { threadId: thread.id },
        orderBy: { receivedAt: "asc" },
      });

      // Initialize all statuses to false
      const threadStatus = {
        draft: oldThread.draftStatus,
        inbox: oldThread.inboxStatus,
        sent: oldThread.sentStatus,
        junk: oldThread.junkStatus,
        trash: oldThread.trashStatus,
      };

      const lastEmail = threadEmails[threadEmails.length - 1]!;
      const lastEmailLabel = lastEmail.emailLabel;
      if (threadStatus.trash) {
        threadStatus.trash = true;
        threadStatus.draft = false;
        threadStatus.inbox = false;
        threadStatus.sent = false;
        threadStatus.junk = false;
      } else {
        if (lastEmailLabel === "junk" && threadStatus.junk) {
          threadStatus.junk = true;
          threadStatus.draft = false;
          threadStatus.inbox = false;
          threadStatus.sent = false;
        } else if (lastEmailLabel === "inbox") {
          threadStatus.inbox = true;
          threadStatus.junk = false;
        } else if (lastEmailLabel === "sent") {
          threadStatus.sent = true;
          threadStatus.junk = false;
        } else if (lastEmailLabel === "draft") {
          threadStatus.draft = true;
          threadStatus.junk = false;
        }
      }

      await db.thread.update({
        where: { id: thread.id },
        data: {
          draftStatus: threadStatus.draft,
          inboxStatus: threadStatus.inbox,
          sentStatus: threadStatus.sent,
          trashStatus: threadStatus.trash,
          junkStatus: threadStatus.junk,
        },
      });
    }

    // 4. Upsert Attachments
    for (const attachment of email.attachments) {
      await upsertAttachment(email.id, attachment);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(`Prisma error for email ${email.id}: ${error.message}`);
    } else {
      console.log(`Unknown error for email ${email.id}:`, error);
    }
  }
  return email;
}

async function upsertEmailAddress(address: EmailAddress, accountId: string) {
  try {
    const existingAddress = await db.emailAddress.findUnique({
      where: {
        accountId_address: {
          accountId: accountId,
          address: address.address ?? "",
        },
      },
    });

    if (existingAddress) {
      return await db.emailAddress.update({
        where: { id: existingAddress.id },
        data: { name: address.name, raw: address.raw },
      });
    } else {
      return await db.emailAddress.create({
        data: {
          address: address.address ?? "",
          name: address.name,
          raw: address.raw,
          accountId,
        },
      });
    }
  } catch (error) {
    console.log(`Failed to upsert email address: `, error);
    return null;
  }
}
async function upsertAttachment(emailId: string, attachment: EmailAttachment) {
  try {
    await db.emailAttachment.upsert({
      where: { id: attachment.id ?? "" },
      update: {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
      create: {
        id: attachment.id,
        emailId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        inline: attachment.inline,
        contentId: attachment.contentId,
        content: attachment.content,
        contentLocation: attachment.contentLocation,
      },
    });
  } catch (error) {
    console.log(`Failed to upsert attachment for email ${emailId}: `, error);
  }
}

export async function updatedeltaToken(deltaToken: string, accountId: string) {
  try {
    await db.account.update({
      where: { id: accountId },
      data: { nextDeltaToken: deltaToken },
    });
  } catch (error) {
    console.error(
      `Failed to update deltaToken for account ${accountId}`,
      error,
    );
  }
}
