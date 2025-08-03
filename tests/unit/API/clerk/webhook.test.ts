// Create mock objects first
const mockValidWebhookPayload = {
  data: {
    id: "user-123",
    email_addresses: [
      { email_address: "test@example.com" },
      { email_address: "secondary@example.com" },
    ],
    first_name: "John",
    last_name: "Doe",
    profile_image_url: "https://example.com/avatar.jpg",
  },
};

const mockMinimalWebhookPayload = {
  data: {
    id: "user-456",
    email_addresses: [{ email_address: "minimal@example.com" }],
    first_name: "Jane",
    last_name: "Smith",
    profile_image_url: null,
  },
};

// Mock database operations
const mockDb = {
  user: {
    upsert: jest.fn(),
  },
};

// Mock Request
const mockRequest = {
  json: jest.fn(),
};

// Mock Response constructor
const mockResponse = jest.fn().mockImplementation((message, options) => ({
  mockResponse: true,
  message,
  ...options,
}));

// Apply all mocks
jest.mock("@/server/db", () => ({ db: mockDb }));

// Mock global Response
global.Response = mockResponse;

// Import the function under test after mocks
const { POST } = require("@/app/api/clerk/webhook/route");

describe("POST /api/webhook", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset all mock implementations to their default successful state
    mockRequest.json.mockResolvedValue(mockValidWebhookPayload);
    mockDb.user.upsert.mockResolvedValue({
      id: "user-123",
      emailAddress: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      imageURL: "https://example.com/avatar.jpg",
    });

    // Reset Response mock
    mockResponse.mockImplementation((message, options) => ({
      mockResponse: true,
      message,
      ...options,
    }));
  });

  describe("Successful scenarios", () => {
    test("should successfully create new user with complete data", async () => {
      const result = await POST(mockRequest);

      // Verify request parsing
      expect(mockRequest.json).toHaveBeenCalledTimes(1);

      // Verify database upsert operation
      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-123",
        },
        update: {
          emailAddress: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          imageURL: "https://example.com/avatar.jpg",
        },
        create: {
          id: "user-123",
          emailAddress: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          imageURL: "https://example.com/avatar.jpg",
        },
      });

      // Verify successful response
      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should successfully update existing user", async () => {
      // Mock existing user update scenario
      mockDb.user.upsert.mockResolvedValue({
        id: "user-123",
        emailAddress: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        imageURL: "https://example.com/avatar.jpg",
        // Additional fields that might exist in existing user
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledTimes(1);
      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle user with minimal data (null profile image)", async () => {
      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(mockMinimalWebhookPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-456",
        },
        update: {
          emailAddress: "minimal@example.com",
          firstName: "Jane",
          lastName: "Smith",
          imageURL: null,
        },
        create: {
          id: "user-456",
          emailAddress: "minimal@example.com",
          firstName: "Jane",
          lastName: "Smith",
          imageURL: null,
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should use first email when multiple emails provided", async () => {
      const multiEmailPayload = {
        data: {
          id: "user-789",
          email_addresses: [
            { email_address: "primary@example.com" },
            { email_address: "secondary@example.com" },
            { email_address: "tertiary@example.com" },
          ],
          first_name: "Multi",
          last_name: "Email",
          profile_image_url: "https://example.com/multi.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(multiEmailPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-789",
        },
        update: {
          emailAddress: "primary@example.com", // Should use first email
          firstName: "Multi",
          lastName: "Email",
          imageURL: "https://example.com/multi.jpg",
        },
        create: {
          id: "user-789",
          emailAddress: "primary@example.com", // Should use first email
          firstName: "Multi",
          lastName: "Email",
          imageURL: "https://example.com/multi.jpg",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle empty string values", async () => {
      const emptyStringPayload = {
        data: {
          id: "user-empty",
          email_addresses: [{ email_address: "empty@example.com" }],
          first_name: "",
          last_name: "",
          profile_image_url: "",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(emptyStringPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-empty",
        },
        update: {
          emailAddress: "empty@example.com",
          firstName: "",
          lastName: "",
          imageURL: "",
        },
        create: {
          id: "user-empty",
          emailAddress: "empty@example.com",
          firstName: "",
          lastName: "",
          imageURL: "",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });
  });

  describe("Error scenarios - Invalid email data", () => {
    test("should return 400 when email_addresses array is empty", async () => {
      const emptyEmailPayload = {
        data: {
          id: "user-no-email",
          email_addresses: [],
          first_name: "No",
          last_name: "Email",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(emptyEmailPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      // Verify no database operations were performed
      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should return 400 when email_addresses is undefined", async () => {
      const undefinedEmailPayload = {
        data: {
          id: "user-undefined-email",
          email_addresses: undefined,
          first_name: "Undefined",
          last_name: "Email",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(undefinedEmailPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should return 400 when first email has empty email_address", async () => {
      const emptyEmailAddressPayload = {
        data: {
          id: "user-empty-email",
          email_addresses: [{ email_address: "" }],
          first_name: "Empty",
          last_name: "EmailAddress",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(emptyEmailAddressPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should return 400 when first email has null email_address", async () => {
      const nullEmailAddressPayload = {
        data: {
          id: "user-null-email",
          email_addresses: [{ email_address: null }],
          first_name: "Null",
          last_name: "EmailAddress",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(nullEmailAddressPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should return 400 when first email has undefined email_address", async () => {
      const undefinedEmailAddressPayload = {
        data: {
          id: "user-undefined-email-address",
          email_addresses: [{ email_address: undefined }],
          first_name: "Undefined",
          last_name: "EmailAddress",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(undefinedEmailAddressPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should return 400 when first email object is missing email_address property", async () => {
      const missingEmailAddressPayload = {
        data: {
          id: "user-missing-email-prop",
          email_addresses: [
            {}, // Missing email_address property
          ],
          first_name: "Missing",
          last_name: "EmailProp",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(missingEmailAddressPayload);

      const result = await POST(mockRequest);

      expect(mockResponse).toHaveBeenCalledWith("No valid email provided", {
        status: 400,
      });

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Error scenarios - Database operations", () => {
    test("should handle database error during upsert", async () => {
      // Override the default mock for this specific test
      mockDb.user.upsert.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(POST(mockRequest)).rejects.toThrow(
        "Database connection failed",
      );

      expect(mockDb.user.upsert).toHaveBeenCalledTimes(1);
    });

    test("should handle database constraint violation", async () => {
      // Override the default mock for this specific test
      mockDb.user.upsert.mockRejectedValue(
        new Error("Unique constraint violation"),
      );

      await expect(POST(mockRequest)).rejects.toThrow(
        "Unique constraint violation",
      );

      expect(mockDb.user.upsert).toHaveBeenCalledTimes(1);
    });

    test("should handle database timeout", async () => {
      // Override the default mock for this specific test
      mockDb.user.upsert.mockRejectedValue(new Error("Query timeout"));

      await expect(POST(mockRequest)).rejects.toThrow("Query timeout");

      expect(mockDb.user.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error scenarios - Request parsing", () => {
    test("should handle malformed JSON request", async () => {
      // Override the default mock for this specific test
      mockRequest.json.mockRejectedValue(new Error("Invalid JSON"));

      await expect(POST(mockRequest)).rejects.toThrow("Invalid JSON");

      // Verify no database operations were performed
      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should handle missing data property", async () => {
      const missingDataPayload = {
        // Missing data property
        id: "user-123",
        email_addresses: [{ email_address: "test@example.com" }],
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(missingDataPayload);

      await expect(POST(mockRequest)).rejects.toThrow();

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });

    test("should handle null data property", async () => {
      const nullDataPayload = {
        data: null,
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(nullDataPayload);

      await expect(POST(mockRequest)).rejects.toThrow();

      expect(mockDb.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    test("should handle very long email addresses", async () => {
      const longEmail = "a".repeat(100) + "@" + "b".repeat(100) + ".com";
      const longEmailPayload = {
        data: {
          id: "user-long-email",
          email_addresses: [{ email_address: longEmail }],
          first_name: "Long",
          last_name: "Email",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(longEmailPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-long-email",
        },
        update: {
          emailAddress: longEmail,
          firstName: "Long",
          lastName: "Email",
          imageURL: "https://example.com/avatar.jpg",
        },
        create: {
          id: "user-long-email",
          emailAddress: longEmail,
          firstName: "Long",
          lastName: "Email",
          imageURL: "https://example.com/avatar.jpg",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle very long names", async () => {
      const longName = "a".repeat(500);
      const longNamePayload = {
        data: {
          id: "user-long-name",
          email_addresses: [{ email_address: "longname@example.com" }],
          first_name: longName,
          last_name: longName,
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(longNamePayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-long-name",
        },
        update: {
          emailAddress: "longname@example.com",
          firstName: longName,
          lastName: longName,
          imageURL: "https://example.com/avatar.jpg",
        },
        create: {
          id: "user-long-name",
          emailAddress: "longname@example.com",
          firstName: longName,
          lastName: longName,
          imageURL: "https://example.com/avatar.jpg",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle special characters in names", async () => {
      const specialCharPayload = {
        data: {
          id: "user-special-chars",
          email_addresses: [{ email_address: "special@example.com" }],
          first_name: "José María",
          last_name: "O'Connor-Smith",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(specialCharPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-special-chars",
        },
        update: {
          emailAddress: "special@example.com",
          firstName: "José María",
          lastName: "O'Connor-Smith",
          imageURL: "https://example.com/avatar.jpg",
        },
        create: {
          id: "user-special-chars",
          emailAddress: "special@example.com",
          firstName: "José María",
          lastName: "O'Connor-Smith",
          imageURL: "https://example.com/avatar.jpg",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle very long URLs", async () => {
      const longUrl = "https://example.com/" + "a".repeat(1000) + ".jpg";
      const longUrlPayload = {
        data: {
          id: "user-long-url",
          email_addresses: [{ email_address: "longurl@example.com" }],
          first_name: "Long",
          last_name: "URL",
          profile_image_url: longUrl,
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(longUrlPayload);

      const result = await POST(mockRequest);

      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-long-url",
        },
        update: {
          emailAddress: "longurl@example.com",
          firstName: "Long",
          lastName: "URL",
          imageURL: longUrl,
        },
        create: {
          id: "user-long-url",
          emailAddress: "longurl@example.com",
          firstName: "Long",
          lastName: "URL",
          imageURL: longUrl,
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });

    test("should handle email validation bypassing", async () => {
      // Test with technically invalid but parseable email
      const weirdEmailPayload = {
        data: {
          id: "user-weird-email",
          email_addresses: [{ email_address: "not-really-an-email" }],
          first_name: "Weird",
          last_name: "Email",
          profile_image_url: "https://example.com/avatar.jpg",
        },
      };

      // Override the default mock for this specific test
      mockRequest.json.mockResolvedValue(weirdEmailPayload);

      const result = await POST(mockRequest);

      // The function doesn't validate email format, so it should still work
      expect(mockDb.user.upsert).toHaveBeenCalledWith({
        where: {
          id: "user-weird-email",
        },
        update: {
          emailAddress: "not-really-an-email",
          firstName: "Weird",
          lastName: "Email",
          imageURL: "https://example.com/avatar.jpg",
        },
        create: {
          id: "user-weird-email",
          emailAddress: "not-really-an-email",
          firstName: "Weird",
          lastName: "Email",
          imageURL: "https://example.com/avatar.jpg",
        },
      });

      expect(mockResponse).toHaveBeenCalledWith("Webhook received", {
        status: 200,
      });
    });
  });
});
