// Mock Clerk auth
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

// Mock DB
jest.mock("@/server/db", () => ({
  db: {
    account: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock Account class
const mockPerformInitialSync = jest.fn();
const mockGetEmailDeltaToken = jest.fn();
jest.mock("@/lib/account", () => ({
  Account: jest.fn().mockImplementation(() => ({
    performInitialSync: mockPerformInitialSync,
    getEmailDeltaToken: mockGetEmailDeltaToken,
  })),
}));

// Mock sync functions
jest.mock("@/lib/sync-to-db", () => ({
  syncEmailToDatabase: jest.fn(),
  updatedeltaToken: jest.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { syncEmailToDatabase, updatedeltaToken } from "@/lib/sync-to-db";

const { updateEmail } = require("@/lib/update-emails");

describe("updateEmail", () => {
  const accountId = "acc123";
  const userId = "user123";
  const accessToken = "token";
  const mockEmails = [{ subject: "Test Email" }];
  const deltaToken = "delta-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId });

    (db.account.findUnique as jest.Mock).mockResolvedValue({
      emailAddress: "test@example.com",
      accessToken,
      nextDeltaToken: null,
    });

    mockPerformInitialSync.mockResolvedValue({
      emails: mockEmails,
      deltaToken,
    });

    mockGetEmailDeltaToken.mockResolvedValue({
      emails: mockEmails,
      deltaToken,
    });

    (syncEmailToDatabase as jest.Mock).mockResolvedValue(undefined);
    (updatedeltaToken as jest.Mock).mockResolvedValue(undefined);
  });

  it("should sync emails and update delta token for initial sync", async () => {
    await expect(updateEmail(accountId)).resolves.toBeUndefined();

    expect(auth).toHaveBeenCalled();
    expect(db.account.findUnique).toHaveBeenCalledWith({
      where: { id: accountId },
      select: {
        emailAddress: true,
        accessToken: true,
        nextDeltaToken: true,
      },
    });
    expect(Account).toHaveBeenCalledWith(accessToken);
    expect(mockPerformInitialSync).toHaveBeenCalled();
    expect(syncEmailToDatabase).toHaveBeenCalledWith(mockEmails, accountId);
    expect(updatedeltaToken).toHaveBeenCalledWith(deltaToken, accountId);
  });

  it("should throw error if user is unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    await expect(updateEmail(accountId)).rejects.toThrow("Unauthorized");
  });

  it("should throw error if account ID is invalid", async () => {
    await expect(updateEmail("")).rejects.toThrow("Invalid account ID");
  });

  it("should throw error if account has no accessToken", async () => {
    (db.account.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(updateEmail(accountId)).rejects.toThrow(
      "Email account not found",
    );
  });

  it("should throw error if sync fails", async () => {
    mockPerformInitialSync.mockRejectedValueOnce(new Error("Sync failure"));
    await expect(updateEmail(accountId)).rejects.toThrow(
      "Sync operation failed",
    );
  });

  it("should throw error if storing emails fails", async () => {
    (syncEmailToDatabase as jest.Mock).mockRejectedValueOnce(
      new Error("DB insert failed"),
    );
    await expect(updateEmail(accountId)).rejects.toThrow(
      "Failed to store emails",
    );
  });

  it("should throw error if delta token update fails", async () => {
    (updatedeltaToken as jest.Mock).mockRejectedValueOnce(
      new Error("Token update failed"),
    );
    await expect(updateEmail(accountId)).rejects.toThrow(
      "Failed to update delta token",
    );
  });
});
