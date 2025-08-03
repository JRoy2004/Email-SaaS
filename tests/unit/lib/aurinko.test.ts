// Mock axios
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  isAxiosError: jest.fn(),
};

// Mock auth from Clerk
const mockAuth = jest.fn();

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
};

// Mock data
const mockTokenResponse = {
  accountId: 12345,
  accessToken: "mock-access-token-123",
  UserId: "user-456",
  userSession: "session-789",
};

const mockAccountDetails = {
  email: "test@example.com",
  mailboxAddress: "test@example.com",
  name: "Test User",
  name2: "Test User Secondary",
  userId: "user-123",
};

const mockAccountInfo = {
  email: "info@example.com",
  mailboxAddress: "info@example.com",
  name: "Info User",
  name2: "Info User Secondary",
  userId: "info-user-456",
};

// Mock process.env
const mockProcessEnv = {
  AURINKO_CLIENT_ID: "test-client-id",
  AURINKO_CLIENT_SECRET: "test-client-secret",
  NEXT_PUBLIC_URL: "https://example.com",
};

// Apply mocks
jest.mock("axios", () => mockAxios);
jest.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

// Mock console
global.console = mockConsole;

// Mock process.env
process.env = { ...process.env, ...mockProcessEnv };

// Import the functions under test after mocks
const {
  getAurinkoAuthUrl,
  exchangeCodeForAccessToken,
  getAccountDetails,
  getAccountInfo,
} = require("@/lib/aurinko");

describe("Aurinko Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAurinkoAuthUrl", () => {
    it("should generate correct auth URL for Google service", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-123" });

      const result = await getAurinkoAuthUrl("Google");

      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        `https://api.aurinko.io/v1/auth/authorize?clientId=test-client-id&serviceType=Google&scopes=Mail.Read+Mail.ReadWrite+Mail.Send+Mail.Drafts+Mail.All&responseType=code&returnUrl=https%3A%2F%2Fexample.com%2Fapi%2Faurinko%2Fcallback`,
      );
    });

    it("should generate correct auth URL for Office365 service", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-123" });

      const result = await getAurinkoAuthUrl("Office365");

      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        `https://api.aurinko.io/v1/auth/authorize?clientId=test-client-id&serviceType=Office365&scopes=Mail.Read+Mail.ReadWrite+Mail.Send+Mail.Drafts+Mail.All&responseType=code&returnUrl=https%3A%2F%2Fexample.com%2Fapi%2Faurinko%2Fcallback`,
      );
    });

    it("should throw error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      await expect(getAurinkoAuthUrl("Google")).rejects.toThrow("unauthorized");
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it("should throw error when userId is undefined", async () => {
      mockAuth.mockResolvedValue({});

      await expect(getAurinkoAuthUrl("Google")).rejects.toThrow("unauthorized");
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe("exchangeCodeForAccessToken", () => {
    it("should successfully exchange code for access token", async () => {
      mockAxios.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await exchangeCodeForAccessToken("test-code-123");

      expect(mockAxios.post).toHaveBeenCalledWith(
        "https://api.aurinko.io/v1/auth/token/test-code-123",
        null,
        {
          auth: {
            username: "test-client-id",
            password: "test-client-secret",
          },
        },
      );
      expect(result).toEqual(mockTokenResponse);
    });

    it("should handle axios error and log it", async () => {
      const axiosError = {
        response: {
          data: { error: "Invalid code" },
        },
      };
      mockAxios.post.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      const result = await exchangeCodeForAccessToken("invalid-code");

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(mockConsole.error).toHaveBeenCalledWith({ error: "Invalid code" });
      expect(mockConsole.error).toHaveBeenCalledWith(axiosError);
      expect(result).toBeUndefined();
    });

    it("should handle non-axios error and log it", async () => {
      const genericError = new Error("Network error");
      mockAxios.post.mockRejectedValue(genericError);
      mockAxios.isAxiosError.mockReturnValue(false);

      const result = await exchangeCodeForAccessToken("test-code");

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(genericError);
      expect(mockConsole.error).toHaveBeenCalledWith(genericError);
      expect(result).toBeUndefined();
    });
  });

  describe("getAccountDetails", () => {
    it("should successfully fetch account details", async () => {
      mockAxios.get.mockResolvedValue({ data: mockAccountDetails });

      const result = await getAccountDetails("test-access-token");

      expect(mockAxios.get).toHaveBeenCalledWith(
        "https://api.aurinko.io/v1/account",
        {
          headers: {
            Authorization: "Bearer test-access-token",
          },
        },
      );
      expect(result).toEqual(mockAccountDetails);
    });

    it("should handle axios error and throw it", async () => {
      const axiosError = {
        response: {
          data: { error: "Unauthorized" },
        },
      };
      mockAxios.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(getAccountDetails("invalid-token")).rejects.toEqual(
        axiosError,
      );

      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Error fetching account details: ",
        { error: "Unauthorized" },
      );
    });

    it("should handle non-axios error and throw it", async () => {
      const genericError = new Error("Network error");
      mockAxios.get.mockRejectedValue(genericError);
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(getAccountDetails("test-token")).rejects.toEqual(
        genericError,
      );

      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(genericError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Unexpected error fetching account details: ",
        genericError,
      );
    });
  });

  describe("getAccountInfo", () => {
    it("should successfully fetch account info by id", async () => {
      mockAxios.get.mockResolvedValue({ data: mockAccountInfo });

      const result = await getAccountInfo(12345);

      expect(mockAxios.get).toHaveBeenCalledWith(
        "https://api.aurinko.io/v1/am/accounts/12345",
        {
          auth: {
            username: "test-client-id",
            password: "test-client-secret",
          },
        },
      );
      expect(result).toEqual(mockAccountInfo);
    });

    it("should handle axios error and throw it", async () => {
      const axiosError = {
        response: {
          data: { error: "Account not found" },
        },
      };
      mockAxios.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(getAccountInfo(99999)).rejects.toEqual(axiosError);

      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(axiosError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Error fetching account by id:",
        { error: "Account not found" },
      );
    });

    it("should handle non-axios error and throw it", async () => {
      const genericError = new Error("Database connection failed");
      mockAxios.get.mockRejectedValue(genericError);
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(getAccountInfo(12345)).rejects.toEqual(genericError);

      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(mockAxios.isAxiosError).toHaveBeenCalledWith(genericError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Unexpected error:",
        genericError,
      );
    });

    it("should work with different account IDs", async () => {
      mockAxios.get.mockResolvedValue({ data: mockAccountInfo });

      await getAccountInfo(54321);

      expect(mockAxios.get).toHaveBeenCalledWith(
        "https://api.aurinko.io/v1/am/accounts/54321",
        {
          auth: {
            username: "test-client-id",
            password: "test-client-secret",
          },
        },
      );
    });
  });

  describe("Edge cases and integration", () => {
    it("should handle missing environment variables gracefully", async () => {
      // Temporarily remove env vars
      const originalEnv = process.env;
      process.env = {};

      mockAuth.mockResolvedValue({ userId: "test-user" });

      // This should still work but with undefined values
      const result = await getAurinkoAuthUrl("Google");

      expect(result).toContain("clientId=undefined");

      // Restore env
      process.env = originalEnv;
    });

    it("should handle concurrent calls properly", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user" });
      mockAxios.get.mockResolvedValue({ data: mockAccountDetails });

      const promises = [
        getAurinkoAuthUrl("Google"),
        getAurinkoAuthUrl("Office365"),
        getAccountDetails("token1"),
        getAccountDetails("token2"),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(mockAuth).toHaveBeenCalledTimes(2);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
