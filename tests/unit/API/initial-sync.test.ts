// Create mock objects first
const mockDbAccount = {
  id: "test-account-id",
  userId: "test-user-id",
  accessToken: "test-access-token",
};

const mockEmails = [
  {
    id: "email-1",
    subject: "Test Email 1",
    body: "This is test email 1",
    from: "sender1@example.com",
    to: "recipient@example.com",
    createdTime: new Date().toISOString(),
  },
  {
    id: "email-2",
    subject: "Test Email 2",
    body: "This is test email 2",
    from: "sender2@example.com",
    to: "recipient@example.com",
    createdTime: new Date().toISOString(),
  },
];

const mockSyncResponse = {
  emails: mockEmails,
  deltaToken: "new-delta-token-123",
};

// Mock database
const mockDb = {
  account: {
    findUnique: jest.fn(),
  },
};

// Mock Account class
const mockAccountInstance = {
  performInitialSync: jest.fn(),
};
const mockAccount = jest.fn().mockImplementation(() => mockAccountInstance);

// Mock NextRequest
const mockNextRequest = {
  json: jest.fn(),
};

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn().mockImplementation((body, options) => ({
    mockResponse: true,
    body,
    ...options,
  })),
};

// Mock Response constructor
const mockResponse = jest.fn().mockImplementation((body, options) => ({
  mockResponse: true,
  body,
  ...options,
}));

// Mock sync functions
const mockSyncEmailToDatabase = jest.fn().mockResolvedValue(undefined);
const mockUpdatedeltaToken = jest.fn().mockResolvedValue(undefined);

// Mock all modules
jest.mock("next/server", () => ({
  NextResponse: mockNextResponse,
}));

jest.mock("@/server/db", () => ({
  db: mockDb,
}));

jest.mock("@/lib/account", () => ({
  Account: mockAccount,
}));

jest.mock("@/lib/sync-to-db", () => ({
  syncEmailToDatabase: mockSyncEmailToDatabase,
  updatedeltaToken: mockUpdatedeltaToken,
}));

// Global Response mock
global.Response = mockResponse;

// Import the function under test after mocks
const { POST } = require("@/app/api/initial-sync/route");

describe("POST /api/initial-sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementations
    mockNextRequest.json.mockResolvedValue({
      accountId: "test-account-id",
      userId: "test-user-id",
    });

    mockDb.account.findUnique.mockResolvedValue(mockDbAccount);
    mockAccountInstance.performInitialSync.mockResolvedValue(mockSyncResponse);
  });

  describe("Input Validation", () => {
    it("should return 400 when accountId is missing", async () => {
      mockNextRequest.json.mockResolvedValue({
        userId: "test-user-id",
      });

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        status: 400,
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        { status: 400 },
      );
    });

    it("should return 400 when userId is missing", async () => {
      mockNextRequest.json.mockResolvedValue({
        accountId: "test-account-id",
      });

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        status: 400,
      });
    });

    it("should return 400 when both accountId and userId are missing", async () => {
      mockNextRequest.json.mockResolvedValue({});

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        status: 400,
      });
    });

    it("should return 400 when accountId is empty string", async () => {
      mockNextRequest.json.mockResolvedValue({
        accountId: "",
        userId: "test-user-id",
      });

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        status: 400,
      });
    });

    it("should return 400 when userId is empty string", async () => {
      mockNextRequest.json.mockResolvedValue({
        accountId: "test-account-id",
        userId: "",
      });

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: {
          message: "Invalid request",
          error: "Missing accountId or userId",
        },
        status: 400,
      });
    });
  });

  describe("Database Account Validation", () => {
    it("should return 404 when account is not found", async () => {
      mockDb.account.findUnique.mockResolvedValue(null);

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: { error: "Account not found" },
        status: 404,
      });
      expect(mockDb.account.findUnique).toHaveBeenCalledWith({
        where: { id: "test-account-id", userId: "test-user-id" },
      });
    });

    it("should query database with correct parameters", async () => {
      await POST(mockNextRequest);

      expect(mockDb.account.findUnique).toHaveBeenCalledWith({
        where: { id: "test-account-id", userId: "test-user-id" },
      });
    });
  });

  describe("Account Operations", () => {
    it("should create Account instance with correct access token", async () => {
      await POST(mockNextRequest);

      expect(mockAccount).toHaveBeenCalledWith("test-access-token");
    });

    it("should return 500 when performInitialSync fails", async () => {
      mockAccountInstance.performInitialSync.mockResolvedValue(null);

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: { error: "Failed to perform initial sync" },
        status: 500,
      });
    });

    it("should return 500 when performInitialSync returns undefined", async () => {
      mockAccountInstance.performInitialSync.mockResolvedValue(undefined);

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: { error: "Failed to perform initial sync" },
        status: 500,
      });
    });

    it("should return 500 when performInitialSync returns false", async () => {
      mockAccountInstance.performInitialSync.mockResolvedValue(false);

      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: { error: "Failed to perform initial sync" },
        status: 500,
      });
    });
  });

  describe("Successful Sync Operations", () => {
    it("should update delta token with correct parameters", async () => {
      await POST(mockNextRequest);

      expect(mockUpdatedeltaToken).toHaveBeenCalledWith(
        "new-delta-token-123",
        "test-account-id",
      );
    });

    it("should sync emails to database with correct parameters", async () => {
      await POST(mockNextRequest);

      expect(mockSyncEmailToDatabase).toHaveBeenCalledWith(
        mockEmails,
        "test-account-id",
      );
    });

    it("should return success response with emails", async () => {
      const response = await POST(mockNextRequest);

      expect(response).toEqual({
        mockResponse: true,
        body: JSON.stringify({
          message: "Email received",
          emails: mockEmails,
        }),
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should handle empty emails array", async () => {
      const emptySyncResponse = {
        emails: [],
        deltaToken: "new-delta-token-123",
      };
      mockAccountInstance.performInitialSync.mockResolvedValue(
        emptySyncResponse,
      );

      const response = await POST(mockNextRequest);

      expect(mockSyncEmailToDatabase).toHaveBeenCalledWith(
        [],
        "test-account-id",
      );
      expect(response).toEqual({
        mockResponse: true,
        body: JSON.stringify({
          message: "Email received",
          emails: [],
        }),
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockDb.account.findUnique.mockRejectedValue(new Error("Database error"));

      await expect(POST(mockNextRequest)).rejects.toThrow("Database error");
    });

    it("should handle performInitialSync errors", async () => {
      mockAccountInstance.performInitialSync.mockRejectedValue(
        new Error("Account initialization failed"),
      );

      await expect(POST(mockNextRequest)).rejects.toThrow(
        "Account initialization failed",
      );
    });

    it("should handle updatedeltaToken errors", async () => {
      mockUpdatedeltaToken.mockRejectedValue(
        new Error("Account initialization failed"),
      );

      await expect(POST(mockNextRequest)).rejects.toThrow(
        "Account initialization failed",
      );
    });

    it("should handle JSON parsing errors", async () => {
      mockNextRequest.json.mockRejectedValue(new Error("Invalid JSON"));

      await expect(POST(mockNextRequest)).rejects.toThrow("Invalid JSON");
    });
  });
});
