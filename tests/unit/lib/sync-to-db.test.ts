// Mock dependencies
jest.mock("@/server/db", () => ({
  db: {
    thread: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    email: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    emailAddress: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    emailAttachment: {
      upsert: jest.fn(),
    },
    account: {
      update: jest.fn(),
    },
  },
}));

// Mock OramaClient
const mockOramaInitialize = jest.fn();
const mockOramaInsert = jest.fn();
jest.mock("@/lib/orama", () => ({
  OramaClient: jest.fn().mockImplementation(() => ({
    initialize: mockOramaInitialize,
    insert: mockOramaInsert,
  })),
}));

// Mock utility functions
jest.mock("@/utils/getPlainText", () => ({
  getPlainText: jest.fn(),
}));

jest.mock("@/lib/embeddings", () => ({
  getEmbeddings: jest.fn(),
}));

// Mock p-limit
jest.mock("p-limit", () => {
  return jest.fn().mockImplementation((concurrency: number) => {
    return (fn: () => Promise<any>) => fn();
  });
});

import { db } from "@/server/db";
import { OramaClient } from "@/lib/orama";
import { getPlainText } from "@/utils/getPlainText";
import { getEmbeddings } from "@/lib/embeddings";
import { syncEmailToDatabase, updatedeltaToken } from "@/lib/sync-to-db";
import type { EmailMessage, EmailAddress, EmailAttachment } from "@/types";

// Mock console methods to avoid noise in tests
const consoleSpy = {
  log: jest.spyOn(console, "log").mockImplementation(),
  error: jest.spyOn(console, "error").mockImplementation(),
};

describe("Email Sync Functions", () => {
  const mockAccountId = "test-account-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (getPlainText as jest.Mock).mockReturnValue("plain text content");
    (getEmbeddings as jest.Mock).mockReturnValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  const createMockEmail = (
    overrides: Partial<EmailMessage> = {},
  ): EmailMessage => ({
    id: "email-123",
    threadId: "thread-123",
    subject: "Test Email",
    body: "<p>Test body content</p>",
    bodySnippet: "Test body snippet",
    from: {
      address: "sender@example.com",
      name: "Sender Name",
      raw: "Sender Name <sender@example.com>",
    },
    to: [
      {
        address: "recipient@example.com",
        name: "Recipient Name",
        raw: "Recipient Name <recipient@example.com>",
      },
    ],
    cc: [],
    bcc: [],
    replyTo: [],
    sentAt: "2024-01-01T10:00:00Z",
    receivedAt: "2024-01-01T10:00:01Z",
    createdTime: "2024-01-01T10:00:00Z",
    internetMessageId: "message-123@example.com",
    sysLabels: ["inbox"],
    keywords: [],
    sysClassifications: [],
    sensitivity: "normal",
    meetingMessageMethod: null,
    hasAttachments: false,
    internetHeaders: [],
    inReplyTo: null,
    references: null,
    threadIndex: null,
    nativeProperties: {},
    folderId: "folder-123",
    omitted: [],
    attachments: [],
    ...overrides,
  });
  describe("syncEmailToDatabase", () => {
    it("should successfully sync emails to database and Orama", async () => {
      const mockEmails = [createMockEmail()];

      // Mock database responses
      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "sender@example.com",
        name: "Sender Name",
      });
      (db.thread.findUnique as jest.Mock).mockResolvedValue(null);
      (db.thread.upsert as jest.Mock).mockResolvedValue({
        id: "thread-123",
        subject: "Test Email",
      });
      (db.email.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(OramaClient).toHaveBeenCalledWith(mockAccountId);
      expect(mockOramaInitialize).toHaveBeenCalled();
      expect(mockOramaInsert).toHaveBeenCalledWith({
        subject: "Test Email",
        body: "plain text content",
        from: "Sender Name <sender@example.com>",
        to: ["Recipient Name <recipient@example.com>"],
        sentAt: "2024-01-01T10:00:00Z",
        threadId: "thread-123",
        embeddings: [0.1, 0.2, 0.3],
      });
    });

    it("should handle emails with attachments", async () => {
      const mockAttachment: EmailAttachment = {
        id: "attachment-123",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        inline: false,
        contentId: null,
        content: null,
        contentLocation: null,
      };

      const mockEmails = [
        createMockEmail({
          hasAttachments: true,
          attachments: [mockAttachment],
        }),
      ];

      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "sender@example.com",
      });
      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});
      (db.emailAttachment.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(db.emailAttachment.upsert).toHaveBeenCalledWith({
        where: { id: "attachment-123" },
        update: {
          name: "document.pdf",
          mimeType: "application/pdf",
          size: 1024,
          inline: false,
          contentId: null,
          content: null,
          contentLocation: null,
        },
        create: {
          id: "attachment-123",
          emailId: "email-123",
          name: "document.pdf",
          mimeType: "application/pdf",
          size: 1024,
          inline: false,
          contentId: null,
          content: null,
          contentLocation: null,
        },
      });
    });

    it("should handle different email label types correctly", async () => {
      const testCases = [
        { sysLabels: ["trash"], expectedLabel: "trash" },
        { sysLabels: ["junk"], expectedLabel: "junk" },
        { sysLabels: ["sent"], expectedLabel: "sent" },
        { sysLabels: ["draft"], expectedLabel: "draft" },
        { sysLabels: ["inbox"], expectedLabel: "inbox" },
        { sysLabels: ["important"], expectedLabel: "inbox" },
        { sysLabels: ["custom"], expectedLabel: "inbox" }, // default case
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockEmails = [createMockEmail({ sysLabels: testCase.sysLabels })];

        (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
        (db.emailAddress.create as jest.Mock).mockResolvedValue({
          id: "addr-123",
          address: "sender@example.com",
        });
        (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
        (db.email.upsert as jest.Mock).mockResolvedValue({});

        await syncEmailToDatabase(mockEmails, mockAccountId);

        expect(db.email.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({
              emailLabel: testCase.expectedLabel,
            }),
            create: expect.objectContaining({
              emailLabel: testCase.expectedLabel,
            }),
          }),
        );
      }
    });

    it("should handle existing email addresses", async () => {
      const mockEmails = [createMockEmail()];
      const existingAddress = {
        id: "existing-addr-123",
        address: "sender@example.com",
        name: "Old Name",
      };

      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(
        existingAddress,
      );
      (db.emailAddress.update as jest.Mock).mockResolvedValue({
        ...existingAddress,
        name: "Sender Name",
      });
      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(db.emailAddress.update).toHaveBeenCalledWith({
        where: { id: "existing-addr-123" },
        data: {
          name: "Sender Name",
          raw: "Sender Name <sender@example.com>",
        },
      });
    });

    it("should handle thread status updates for existing threads", async () => {
      const mockEmails = [createMockEmail({ sysLabels: ["sent"] })];
      const existingThread = {
        id: "thread-123",
        draftStatus: false,
        inboxStatus: true,
        sentStatus: false,
        trashStatus: false,
        junkStatus: false,
      };

      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "sender@example.com",
      });
      (db.thread.findUnique as jest.Mock).mockResolvedValue(existingThread);
      (db.thread.upsert as jest.Mock).mockResolvedValue(existingThread);
      (db.email.upsert as jest.Mock).mockResolvedValue({});
      (db.email.findMany as jest.Mock).mockResolvedValue([
        { emailLabel: "sent", receivedAt: new Date() },
      ]);

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(db.thread.update).toHaveBeenCalledWith({
        where: { id: "thread-123" },
        data: {
          draftStatus: false,
          inboxStatus: true,
          sentStatus: true,
          trashStatus: false,
          junkStatus: false,
        },
      });
    });

    it("should handle missing bodySnippet by using plain text from body", async () => {
      const mockEmails = [
        createMockEmail({
          bodySnippet: null,
          body: "<p>HTML content</p>",
        }),
      ];

      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "sender@example.com",
      });
      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(getPlainText).toHaveBeenCalledWith("<p>HTML content</p>");
      expect(mockOramaInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          body: "plain text content",
        }),
      );
    });

    it("should handle emails with multiple recipients", async () => {
      const emailWithMultipleRecipients = createMockEmail({
        to: [
          {
            address: "to1@example.com",
            name: "To One",
            raw: "To One <to1@example.com>",
          },
          {
            address: "to2@example.com",
            name: "To Two",
            raw: "To Two <to2@example.com>",
          },
        ],
        cc: [
          {
            address: "cc1@example.com",
            name: "CC One",
            raw: "CC One <cc1@example.com>",
          },
        ],
        bcc: [
          {
            address: "bcc1@example.com",
            name: "BCC One",
            raw: "BCC One <bcc1@example.com>",
          },
        ],
      });

      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock)
        .mockResolvedValueOnce({
          id: "from-addr",
          address: "sender@example.com",
        })
        .mockResolvedValueOnce({ id: "to1-addr", address: "to1@example.com" })
        .mockResolvedValueOnce({ id: "to2-addr", address: "to2@example.com" })
        .mockResolvedValueOnce({ id: "cc1-addr", address: "cc1@example.com" })
        .mockResolvedValueOnce({
          id: "bcc1-addr",
          address: "bcc1@example.com",
        });

      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase([emailWithMultipleRecipients], mockAccountId);

      expect(mockOramaInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["To One <to1@example.com>", "To Two <to2@example.com>"],
        }),
      );
    });

    it("should skip email processing if from address fails to upsert", async () => {
      const mockEmails = [createMockEmail()];

      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock).mockResolvedValue(null);

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upsert from address for email"),
      );
      expect(db.thread.upsert).not.toHaveBeenCalled();
      expect(db.email.upsert).not.toHaveBeenCalled();
    });
  });

  describe("updatedeltaToken", () => {
    it("should successfully update delta token", async () => {
      const deltaToken = "new-delta-token-123";
      (db.account.update as jest.Mock).mockResolvedValue({});

      await updatedeltaToken(deltaToken, mockAccountId);

      expect(db.account.update).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        data: { nextDeltaToken: deltaToken },
      });
    });

    it("should handle update errors", async () => {
      const deltaToken = "new-delta-token-123";
      const error = new Error("Update failed");
      (db.account.update as jest.Mock).mockRejectedValue(error);

      await updatedeltaToken(deltaToken, mockAccountId);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        `Failed to update deltaToken for account ${mockAccountId}`,
        error,
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle emails with missing required fields", async () => {
      const incompleteEmail = createMockEmail({
        from: { address: "", name: "", raw: "" },
        subject: "",
      });

      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "",
      });
      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailToDatabase([incompleteEmail], mockAccountId);

      expect(db.emailAddress.create).toHaveBeenCalledWith({
        data: {
          address: "",
          name: "",
          raw: "",
          accountId: mockAccountId,
        },
      });
    });

    it("should handle attachment upsert failures gracefully", async () => {
      const mockAttachment: EmailAttachment = {
        id: "attachment-123",
        name: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        inline: false,
        contentId: null,
        content: null,
        contentLocation: null,
      };

      const mockEmails = [
        createMockEmail({
          hasAttachments: true,
          attachments: [mockAttachment],
        }),
      ];

      (db.emailAddress.create as jest.Mock).mockResolvedValue({
        id: "addr-123",
        address: "sender@example.com",
      });
      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: "thread-123" });
      (db.email.upsert as jest.Mock).mockResolvedValue({});
      (db.emailAttachment.upsert as jest.Mock).mockRejectedValue(
        new Error("Attachment error"),
      );

      await syncEmailToDatabase(mockEmails, mockAccountId);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upsert attachment for email"),
        expect.any(Error),
      );
    });
  });
});
