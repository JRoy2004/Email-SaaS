// Mock axios
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  isAxiosError: jest.fn(),
};

// Mock console methods to avoid test output noise
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
};

// Mock data
const mockSyncResponse = {
  ready: true,
  syncUpdatedToken: "initial-delta-token-123",
};

const mockSyncNotReadyResponse = {
  ready: false,
  syncUpdatedToken: "not-ready-token",
};

const mockSyncUpdatedResponse = {
  records: [
    {
      id: "email-1",
      subject: "Test Email 1",
      body: "Test body 1",
      from: [{ email: "sender1@example.com", name: "Sender One" }],
      to: [{ email: "recipient1@example.com", name: "Recipient One" }],
    },
    {
      id: "email-2",
      subject: "Test Email 2",
      body: "Test body 2",
      from: [{ email: "sender2@example.com", name: "Sender Two" }],
      to: [{ email: "recipient2@example.com", name: "Recipient Two" }],
    },
  ],
  nextDeltaToken: "next-delta-token-456",
  nextPageToken: null,
};

const mockSyncUpdatedResponseWithPagination = {
  records: [
    {
      id: "email-3",
      subject: "Test Email 3",
      body: "Test body 3",
      from: [{ email: "sender3@example.com", name: "Sender Three" }],
      to: [{ email: "recipient3@example.com", name: "Recipient Three" }],
    },
  ],
  nextDeltaToken: "paginated-delta-token-789",
  nextPageToken: "page-token-123",
};

const mockSyncUpdatedResponsePage2 = {
  records: [
    {
      id: "email-4",
      subject: "Test Email 4",
      body: "Test body 4",
      from: [{ email: "sender4@example.com", name: "Sender Four" }],
      to: [{ email: "recipient4@example.com", name: "Recipient Four" }],
    },
  ],
  nextDeltaToken: "final-delta-token-999",
  nextPageToken: null,
};

const mockSendEmailResponse = {
  id: "sent-email-123",
  threadId: "thread-456",
  status: "Ok",
  processingStatus: "Ok",
};

const mockEmailPayload = {
  from: { email: "sender@example.com", name: "Sender" },
  subject: "Test Subject",
  body: "<h1>Test Body</h1>",
  to: [{ email: "recipient@example.com", name: "Recipient" }],
  cc: [{ email: "cc@example.com", name: "CC Recipient" }],
  bcc: [{ email: "bcc@example.com", name: "BCC Recipient" }],
  replyTo: { email: "replyto@example.com", name: "Reply To" },
  inReplyTo: "in-reply-to-123",
  references: "references-456",
  threadId: "thread-789",
};

// Mock process.env
const mockProcessEnv = {
  AURINKO_API_BASE_URL: "https://api.aurinko.io",
};

// Apply mocks
jest.mock("axios", () => mockAxios);

// Mock console
global.console = mockConsole;

// Mock process.env
process.env = { ...process.env, ...mockProcessEnv };

// Import the Account class after mocks
const { Account } = require("@/lib/account");

describe("Account Class", () => {
  let account;
  const testToken = "test-access-token-123";

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Create new account instance
    account = new Account(testToken);

    // Reset axios mocks to default successful responses
    mockAxios.post.mockResolvedValue({ data: mockSyncResponse });
    mockAxios.get.mockResolvedValue({ data: mockSyncUpdatedResponse });
    mockAxios.isAxiosError.mockReturnValue(false);

    // Reset console mocks
    mockConsole.log.mockImplementation(() => {});
    mockConsole.error.mockImplementation(() => {});
  });

  describe("Constructor", () => {
    test("should create Account instance with access token", () => {
      const testAccount = new Account("my-token");
      expect(testAccount).toBeInstanceOf(Account);
      // Private property, so we can't directly test it, but we can test it through methods
    });

    test("should accept empty string as token", () => {
      const testAccount = new Account("");
      expect(testAccount).toBeInstanceOf(Account);
    });

    test("should accept null token", () => {
      const testAccount = new Account(null);
      expect(testAccount).toBeInstanceOf(Account);
    });
  });

  describe("performInitialSync", () => {
    describe("Successful scenarios", () => {
      test("should perform initial sync successfully when ready immediately", async () => {
        const result = await account.performInitialSync();

        // Verify startSync was called
        expect(mockAxios.post).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/sync",
          null,
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              daysWithin: 1,
              bodyType: "html",
            },
          },
        );

        // Verify getUpdatedEmails was called
        expect(mockAxios.get).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: "initial-delta-token-123",
              pageToken: null,
            },
          },
        );

        // Verify result
        expect(result.emails).toEqual(mockSyncUpdatedResponse.records);
        expect(result.deltaToken).toBe("next-delta-token-456");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Initial sync completed. We hav synced, 2 emails",
        );
      });

      test("should handle sync not ready initially", async () => {
        // First call returns not ready, second call returns ready
        mockAxios.post
          .mockResolvedValueOnce({ data: mockSyncNotReadyResponse })
          .mockResolvedValueOnce({ data: mockSyncResponse });

        // Mock setTimeout to resolve immediately for testing
        jest.spyOn(global, "setTimeout").mockImplementation((callback) => {
          callback();
          return null;
        });

        const result = await account.performInitialSync();

        // Verify startSync was called twice
        expect(mockAxios.post).toHaveBeenCalledTimes(2);
        expect(result.emails).toEqual(mockSyncUpdatedResponse.records);
        expect(result.deltaToken).toBe("next-delta-token-456");

        // Restore setTimeout
        jest.restoreAllMocks();
      });

      test("should handle pagination correctly", async () => {
        // Mock paginated responses
        mockAxios.get
          .mockResolvedValueOnce({
            data: mockSyncUpdatedResponseWithPagination,
          })
          .mockResolvedValueOnce({ data: mockSyncUpdatedResponsePage2 });

        const result = await account.performInitialSync();

        // Verify getUpdatedEmails was called twice (initial + pagination)
        expect(mockAxios.get).toHaveBeenCalledTimes(2);

        // First call with deltaToken
        expect(mockAxios.get).toHaveBeenNthCalledWith(
          1,
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: "initial-delta-token-123",
              pageToken: null,
            },
          },
        );

        // Second call with pageToken
        expect(mockAxios.get).toHaveBeenNthCalledWith(
          2,
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: null,
              pageToken: "page-token-123",
            },
          },
        );

        // Verify combined results
        const expectedEmails = [
          ...mockSyncUpdatedResponseWithPagination.records,
          ...mockSyncUpdatedResponsePage2.records,
        ];
        expect(result.emails).toEqual(expectedEmails);
        expect(result.deltaToken).toBe("final-delta-token-999");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Initial sync completed. We hav synced, 2 emails",
        );
      });

      test("should handle empty email records", async () => {
        const emptyResponse = {
          records: [],
          nextDeltaToken: "empty-delta-token",
          nextPageToken: null,
        };
        mockAxios.get.mockResolvedValue({ data: emptyResponse });

        const result = await account.performInitialSync();

        expect(result.emails).toEqual([]);
        expect(result.deltaToken).toBe("empty-delta-token");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Initial sync completed. We hav synced, 0 emails",
        );
      });
    });

    describe("Error scenarios", () => {
      test("should handle axios error in startSync", async () => {
        const axiosError = {
          response: {
            data: { error: "Unauthorized", code: 401 },
          },
        };
        mockAxios.post.mockRejectedValue(axiosError);
        mockAxios.isAxiosError.mockReturnValue(true);

        const result = await account.performInitialSync();

        expect(result).toBeUndefined();
        expect(mockConsole.error).toHaveBeenCalledWith(
          "Error starting a new email sync: ",
          axiosError.response.data,
        );
      });

      test("should handle non-axios error in startSync", async () => {
        const genericError = new Error("Network error");
        mockAxios.post.mockRejectedValue(genericError);
        mockAxios.isAxiosError.mockReturnValue(false);

        const result = await account.performInitialSync();

        expect(result).toBeUndefined();
        expect(mockConsole.error).toHaveBeenCalledWith(
          "Unexpected error while starting a new email sync: ",
          genericError,
        );
      });

      test("should handle axios error in getUpdatedEmails", async () => {
        const axiosError = {
          response: {
            data: { error: "Rate limit exceeded", code: 429 },
          },
        };
        mockAxios.get.mockRejectedValue(axiosError);
        mockAxios.isAxiosError.mockReturnValue(true);

        const result = await account.performInitialSync();

        expect(result).toBeUndefined();
        expect(mockConsole.error).toHaveBeenCalledWith(
          "Error fetching email list: ",
          axiosError.response.data,
        );
      });
    });
  });

  describe("sendEmail", () => {
    describe("Successful scenarios", () => {
      test("should send email successfully with all parameters", async () => {
        mockAxios.post.mockResolvedValue({ data: mockSendEmailResponse });

        const result = await account.sendEmail(mockEmailPayload);

        expect(mockAxios.post).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/messages",
          {
            from: mockEmailPayload.from,
            subject: mockEmailPayload.subject,
            body: mockEmailPayload.body,
            inReplyTo: mockEmailPayload.inReplyTo,
            references: mockEmailPayload.references,
            threadId: mockEmailPayload.threadId,
            to: mockEmailPayload.to,
            cc: mockEmailPayload.cc,
            bcc: mockEmailPayload.bcc,
            replyTo: [mockEmailPayload.replyTo],
          },
          {
            params: {
              bodyType: "html",
              returnIds: true,
            },
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
          },
        );

        expect(result).toEqual(mockSendEmailResponse);
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Email sent successfully",
          mockSendEmailResponse,
        );
      });

      test("should send email with minimal parameters", async () => {
        const minimalPayload = {
          from: { email: "sender@example.com", name: "Sender" },
          subject: "Minimal Subject",
          body: "Minimal body",
          to: [{ email: "recipient@example.com", name: "Recipient" }],
        };

        mockAxios.post.mockResolvedValue({ data: mockSendEmailResponse });

        const result = await account.sendEmail(minimalPayload);

        expect(mockAxios.post).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/messages",
          {
            from: minimalPayload.from,
            subject: minimalPayload.subject,
            body: minimalPayload.body,
            inReplyTo: undefined,
            references: undefined,
            threadId: undefined,
            to: minimalPayload.to,
            cc: undefined,
            bcc: undefined,
            replyTo: [undefined],
          },
          {
            params: {
              bodyType: "html",
              returnIds: true,
            },
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
          },
        );

        expect(result).toEqual(mockSendEmailResponse);
      });

      test("should handle incomplete processing status", async () => {
        const incompleteResponse = {
          ...mockSendEmailResponse,
          processingStatus: "Incomplete",
        };
        mockAxios.post.mockResolvedValue({ data: incompleteResponse });

        const result = await account.sendEmail(mockEmailPayload);

        expect(result.processingStatus).toBe("Incomplete");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Email sent successfully",
          incompleteResponse,
        );
      });
    });

    describe("Error scenarios", () => {
      test("should handle non-axios error when sending email", async () => {
        const genericError = new Error("Network timeout");
        mockAxios.post.mockRejectedValue(genericError);
        mockAxios.isAxiosError.mockReturnValue(false);

        await expect(account.sendEmail(mockEmailPayload)).rejects.toThrow(
          "Network timeout",
        );

        expect(mockConsole.error).toHaveBeenCalledWith(
          "Error sending email:",
          genericError,
        );
      });
    });
  });

  describe("getEmailDeltaToken", () => {
    describe("Successful scenarios", () => {
      test("should get emails using delta token successfully", async () => {
        const testDeltaToken = "existing-delta-token-123";

        const result = await account.getEmailDeltaToken(testDeltaToken);

        expect(mockAxios.get).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: testDeltaToken,
              pageToken: null,
            },
          },
        );

        expect(result.emails).toEqual(mockSyncUpdatedResponse.records);
        expect(result.deltaToken).toBe("next-delta-token-456");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Initial sync completed. We hav synced, 2 emails",
        );
      });

      test("should handle pagination in getEmailDeltaToken", async () => {
        const testDeltaToken = "paginated-delta-token";

        mockAxios.get
          .mockResolvedValueOnce({
            data: mockSyncUpdatedResponseWithPagination,
          })
          .mockResolvedValueOnce({ data: mockSyncUpdatedResponsePage2 });

        const result = await account.getEmailDeltaToken(testDeltaToken);

        expect(mockAxios.get).toHaveBeenCalledTimes(2);

        // First call with deltaToken
        expect(mockAxios.get).toHaveBeenNthCalledWith(
          1,
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: testDeltaToken,
              pageToken: null,
            },
          },
        );

        // Second call with pageToken
        expect(mockAxios.get).toHaveBeenNthCalledWith(
          2,
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: null,
              pageToken: "page-token-123",
            },
          },
        );

        const expectedEmails = [
          ...mockSyncUpdatedResponseWithPagination.records,
          ...mockSyncUpdatedResponsePage2.records,
        ];
        expect(result.emails).toEqual(expectedEmails);
        expect(result.deltaToken).toBe("final-delta-token-999");
      });

      test("should handle empty delta token", async () => {
        const result = await account.getEmailDeltaToken("");

        expect(mockAxios.get).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: "",
              pageToken: null,
            },
          },
        );

        expect(result.emails).toEqual(mockSyncUpdatedResponse.records);
        expect(result.deltaToken).toBe("next-delta-token-456");
      });

      test("should handle null delta token", async () => {
        const result = await account.getEmailDeltaToken(null);

        expect(mockAxios.get).toHaveBeenCalledWith(
          "https://api.aurinko.io/v1/email/sync/updated",
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            params: {
              deltaToken: null,
              pageToken: null,
            },
          },
        );

        expect(result.emails).toEqual(mockSyncUpdatedResponse.records);
        expect(result.deltaToken).toBe("next-delta-token-456");
      });
    });

    describe("Error scenarios", () => {
      test("should handle non-axios error in getEmailDeltaToken", async () => {
        const genericError = new Error("Connection timeout");
        mockAxios.get.mockRejectedValue(genericError);
        mockAxios.isAxiosError.mockReturnValue(false);

        await expect(account.getEmailDeltaToken("test-token")).rejects.toThrow(
          "Connection timeout",
        );

        expect(mockConsole.error).toHaveBeenCalledWith(
          "Unexpected error while fetching email list: ",
          genericError,
        );
      });
    });
  });

  describe("Edge cases and integration", () => {
    test("should handle multiple method calls with same instance", async () => {
      // First, perform initial sync
      const syncResult = await account.performInitialSync();
      expect(syncResult.emails).toEqual(mockSyncUpdatedResponse.records);

      // Then, send an email
      mockAxios.post.mockResolvedValue({ data: mockSendEmailResponse });
      const sendResult = await account.sendEmail(mockEmailPayload);
      expect(sendResult).toEqual(mockSendEmailResponse);

      // Finally, get updated emails
      const deltaResult = await account.getEmailDeltaToken("new-delta-token");
      expect(deltaResult.emails).toEqual(mockSyncUpdatedResponse.records);

      // Verify all methods were called
      expect(mockAxios.post).toHaveBeenCalledTimes(2); // startSync + sendEmail
      expect(mockAxios.get).toHaveBeenCalledTimes(2); // performInitialSync + getEmailDeltaToken
    });

    test("should handle very large email arrays", async () => {
      const largeEmailArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `email-${i}`,
        subject: `Test Email ${i}`,
        body: `Test body ${i}`,
        from: [{ email: `sender${i}@example.com`, name: `Sender ${i}` }],
        to: [{ email: `recipient${i}@example.com`, name: `Recipient ${i}` }],
      }));

      const largeResponse = {
        records: largeEmailArray,
        nextDeltaToken: "large-delta-token",
        nextPageToken: null,
      };

      mockAxios.get.mockResolvedValue({ data: largeResponse });

      const result = await account.performInitialSync();

      expect(result.emails).toHaveLength(1000);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Initial sync completed. We hav synced, 1000 emails",
      );
    });

    test("should handle special characters in email content", async () => {
      const specialCharPayload = {
        from: { email: "sender@example.com", name: "José María" },
        subject: "Subject with émojis 🎉 and spëcial chars",
        body: "<h1>Body with 中文 and العربية</h1>",
        to: [{ email: "recipient@example.com", name: "Récipient" }],
      };

      mockAxios.post.mockResolvedValue({ data: mockSendEmailResponse });

      const result = await account.sendEmail(specialCharPayload);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "https://api.aurinko.io/v1/email/messages",
        expect.objectContaining({
          from: specialCharPayload.from,
          subject: specialCharPayload.subject,
          body: specialCharPayload.body,
          to: specialCharPayload.to,
        }),
        expect.any(Object),
      );

      expect(result).toEqual(mockSendEmailResponse);
    });

    test("should handle network timeout gracefully", async () => {
      const timeoutError = new Error("ETIMEDOUT");
      timeoutError.code = "ETIMEDOUT";
      mockAxios.post.mockRejectedValue(timeoutError);
      mockAxios.isAxiosError.mockReturnValue(false);

      const result = await account.performInitialSync();

      expect(result).toBeUndefined();
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Unexpected error while starting a new email sync: ",
        timeoutError,
      );
    });
  });
});
