// Mock NextRequest before importing
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((url) => ({
    url,
    nextUrl: {
      searchParams: new URLSearchParams(url.split("?")[1] || ""),
    },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(),
    })),
    redirect: jest.fn().mockImplementation((url) => ({
      status: 307,
      headers: new Map([["location", url.toString()]]),
    })),
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/aurinko/callback/route"; // Adjust path as needed

// Mock dependencies
jest.mock("@vercel/functions", () => ({
  waitUntil: jest.fn(),
}));

jest.mock("@/lib/aurinko", () => ({
  exchangeCodeForAccessToken: jest.fn(),
  getAccountDetails: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    account: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

import { waitUntil } from "@vercel/functions";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

describe("OAuth Callback Route (GET)", () => {
  const mockUserId = "user_123";
  const mockCode = "auth_code_123";
  const mockToken = {
    accessToken: "access_token_123",
    accountId: 456,
  };
  const mockAccountDetails = {
    email: "test@example.com",
    name: "Test User",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variable
    process.env.NEXT_PUBLIC_URL = "https://example.com";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication Tests", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: null });
      const req = new NextRequest(
        "https://example.com/callback?status=success&code=123",
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ message: "Unauthorized" });
    });

    it("should proceed when user is authenticated", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest("https://example.com/callback?status=failed");

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).not.toBe(401);
    });
  });

  describe("Status Parameter Tests", () => {
    it('should return 400 when status is not "success"', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest("https://example.com/callback?status=failed");

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "Failed to link account" });
    });

    it("should return 400 when status is missing", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest("https://example.com/callback");

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "Failed to link account" });
    });

    it('should proceed when status is "success"', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest(
        "https://example.com/callback?status=success",
      );

      // Act
      const response = await GET(req);

      // Assert - Should fail at code validation, not status validation
      const data = await response.json();
      expect(data.message).toBe("No code Provided");
    });
  });

  describe("Code Parameter Tests", () => {
    it("should return 400 when code is missing", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest(
        "https://example.com/callback?status=success",
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "No code Provided" });
    });

    it("should return 400 when code is empty string", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest(
        "https://example.com/callback?status=success&code=",
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "No code Provided" });
    });

    it("should trim whitespace from code parameter", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        "https://example.com/callback?status=success&code=  auth_code_123  ",
      );

      // Act
      await GET(req);

      // Assert
      expect(exchangeCodeForAccessToken).toHaveBeenCalledWith("auth_code_123");
    });
  });

  describe("Token Exchange Tests", () => {
    it("should return 400 when token exchange fails", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        message: "Failed to exchange code for access token",
      });
      expect(exchangeCodeForAccessToken).toHaveBeenCalledWith(mockCode);
    });

    it("should proceed when token exchange succeeds", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      const response = await GET(req);

      // Assert
      expect(exchangeCodeForAccessToken).toHaveBeenCalledWith(mockCode);
      expect(getAccountDetails).toHaveBeenCalledWith(mockToken.accessToken);
    });
  });

  describe("Database Operations Tests", () => {
    it("should upsert account with correct data", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert
      expect(db.account.upsert).toHaveBeenCalledWith({
        where: { id: mockToken.accountId.toString() },
        update: { accessToken: mockToken.accessToken },
        create: {
          id: mockToken.accountId.toString(),
          userId: mockUserId,
          accessToken: mockToken.accessToken,
          emailAddress: mockAccountDetails.email,
          name: mockAccountDetails.name,
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act & Assert
      await expect(GET(req)).rejects.toThrow("Database error");
    });
  });

  describe("Initial Sync Tests", () => {
    it("should trigger initial sync with correct parameters", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert
      expect(waitUntil).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,
        {
          accountId: mockToken.accountId.toString(),
          userId: mockUserId,
        },
      );
    });

    it("should handle initial sync failure without affecting response", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockRejectedValue(new Error("Sync failed"));

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      const response = await GET(req);

      // Assert - Should still redirect successfully
      expect(response.status).toBe(307); // Redirect status
      expect(waitUntil).toHaveBeenCalled();
    });
  });

  describe("Success Flow Tests", () => {
    it("should redirect to /mail on successful flow", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get("location")).toBe("https://example.com/mail");
    });

    it("should complete entire flow with all function calls", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert all functions were called
      expect(auth).toHaveBeenCalled();
      expect(exchangeCodeForAccessToken).toHaveBeenCalledWith(mockCode);
      expect(getAccountDetails).toHaveBeenCalledWith(mockToken.accessToken);
      expect(db.account.upsert).toHaveBeenCalled();
      expect(waitUntil).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle numeric account IDs correctly", async () => {
      // Arrange
      const numericToken = { ...mockToken, accountId: 999 };
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(numericToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert
      expect(db.account.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "999" },
          create: expect.objectContaining({ id: "999" }),
        }),
      );
    });

    it("should handle missing environment variable", async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_URL;
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        "undefined/api/initial-sync",
        expect.any(Object),
      );
    });

    it("should handle whitespace-only code parameter", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest(
        "https://example.com/callback?status=success&code=   ",
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "No code Provided" });
    });

    it("should handle case-sensitive status parameter", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      const req = new NextRequest(
        "https://example.com/callback?status=Success",
      );

      // Act
      const response = await GET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ message: "Failed to link account" });
    });
  });

  describe("Console Log Tests", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log callback route hit", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: null });
      const req = new NextRequest("https://example.com/callback");

      // Act
      await GET(req);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith("Callback route hit");
    });

    it("should log status, code, token, and account details", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
      (exchangeCodeForAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (getAccountDetails as jest.Mock).mockResolvedValue(mockAccountDetails);
      (db.account.upsert as jest.Mock).mockResolvedValue({});
      (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

      const req = new NextRequest(
        `https://example.com/callback?status=success&code=${mockCode}`,
      );

      // Act
      await GET(req);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith("STATUS\n", "success");
      expect(consoleSpy).toHaveBeenCalledWith("CODE\n", mockCode);
      expect(consoleSpy).toHaveBeenCalledWith("TOKEN\n", mockToken);
      expect(consoleSpy).toHaveBeenCalledWith(
        "ACCOUNT DETAILS\n",
        mockAccountDetails,
      );
    });
  });
});
