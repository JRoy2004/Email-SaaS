// Create mock objects first
const mockStreamTextResult = {
  toDataStreamResponse: jest.fn().mockReturnValue("mock-data-stream"),
  toTextStreamResponse: jest.fn().mockReturnValue("mock-text-stream"),
};

const mockStreamText = jest.fn().mockReturnValue(mockStreamTextResult);
const mockOpenAI = { chat: jest.fn().mockReturnValue("mock-openai-model") };
const mockNextResponse = {
  json: jest.fn().mockImplementation((body, options) => ({
    mockResponse: true,
    body,
    ...options,
  })),
};
const mockAuth = jest.fn();

// Mock OramaClient class and instance
const mockOramaInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  vectorSearch: jest.fn().mockResolvedValue({
    hits: [
      {
        document: {
          id: "1",
          subject: "Test Email",
          content: "This is a test email content",
        },
      },
    ],
  }),
};
const mockOramaClient = jest.fn().mockImplementation(() => mockOramaInstance);

// Mock all modules
jest.mock("ai", () => ({ streamText: mockStreamText }));
jest.mock("@ai-sdk/openai", () => ({ openai: mockOpenAI }));
jest.mock("next/server", () => ({ NextResponse: mockNextResponse }));
jest.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
jest.mock("@/lib/orama", () => ({ OramaClient: mockOramaClient }));

// Import the function under test after mocks
const { POST } = require("@/app/api/chat/route");

describe("POST /api/chat - Simplified Tests", () => {
  let mockRequest;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh mock request
    mockRequest = {
      json: jest.fn(),
    };

    // Reset default mock behaviors
    mockAuth.mockResolvedValue({ userId: "user123" });
    mockOramaInstance.initialize.mockResolvedValue(undefined);
    mockOramaInstance.vectorSearch.mockResolvedValue({
      hits: [{ document: { id: "1", subject: "Test", content: "Content" } }],
    });
  });

  describe("Authentication", () => {
    test("should return 401 when user is not authenticated", async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: null });

      // Act
      const result = await POST(mockRequest);

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 },
      );
      expect(mockRequest.json).not.toHaveBeenCalled();
      expect(result.mockResponse).toBe(true);
    });

    test("should proceed when user is authenticated", async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: "test-user" });
      mockRequest.json.mockResolvedValue({
        messages: [{ id: "1", role: "user", content: "test message" }],
        accountId: "test-account",
      });

      // Act
      const result = await POST(mockRequest);

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockOramaClient).toHaveBeenCalledWith("test-account");
    });
  });

  describe("Request Processing", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user123" });
    });

    test("should process messages and perform vector search", async () => {
      // Arrange
      const testMessages = [
        { id: "1", role: "user", content: "Help me write an email" },
        { id: "2", role: "assistant", content: "Sure, I can help" },
        { id: "3", role: "user", content: "About project updates" },
      ];

      mockRequest.json.mockResolvedValue({
        messages: testMessages,
        accountId: "account123",
      });

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockOramaClient).toHaveBeenCalledWith("account123");
      expect(mockOramaInstance.initialize).toHaveBeenCalledTimes(1);
      expect(mockOramaInstance.vectorSearch).toHaveBeenCalledWith({
        prompt: "About project updates", // Should use last message
      });
    });

    test("should handle empty messages array", async () => {
      // Arrange
      mockRequest.json.mockResolvedValue({
        messages: [],
        accountId: "account123",
      });

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockOramaInstance.vectorSearch).toHaveBeenCalledWith({
        prompt: "", // Should use empty string
      });
    });

    test("should handle messages without content", async () => {
      // Arrange
      const testMessages = [
        { id: "1", role: "user" }, // No content property
      ];

      mockRequest.json.mockResolvedValue({
        messages: testMessages,
        accountId: "account123",
      });

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockOramaInstance.vectorSearch).toHaveBeenCalledWith({
        prompt: "",
      });
    });
  });

  describe("AI Integration", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user123" });
      mockRequest.json.mockResolvedValue({
        messages: [{ id: "1", role: "user", content: "test query" }],
        accountId: "account123",
      });
    });

    test("should call streamText with correct parameters", async () => {
      // Act
      await POST(mockRequest);

      // Assert
      expect(mockStreamText).toHaveBeenCalledTimes(1);

      const callArgs = mockStreamText.mock.calls[0][0];
      expect(callArgs.model).toBe("mock-openai-model");
      expect(callArgs.messages).toHaveLength(2); // system + user message

      // Check system message
      const systemMessage = callArgs.messages[0];
      expect(systemMessage.role).toBe("system");
      expect(systemMessage.content).toContain("You are an AI email assistant");
      expect(systemMessage.content).toContain("START CONTEXT BLOCK");
      expect(systemMessage.content).toContain("END OF CONTEXT BLOCK");

      // Check user message
      expect(callArgs.messages[1]).toEqual({
        id: "1",
        role: "user",
        content: "test query",
      });
    });

    test("should include search results in system prompt", async () => {
      // Arrange
      mockOramaInstance.vectorSearch.mockResolvedValue({
        hits: [
          { document: { id: "1", subject: "Email 1", content: "Content 1" } },
          { document: { id: "2", subject: "Email 2", content: "Content 2" } },
        ],
      });

      // Act
      await POST(mockRequest);

      // Assert
      const callArgs = mockStreamText.mock.calls[0][0];
      const systemPrompt = callArgs.messages[0].content;

      expect(systemPrompt).toContain("Email 1");
      expect(systemPrompt).toContain("Email 2");
      expect(systemPrompt).toContain("Content 1");
      expect(systemPrompt).toContain("Content 2");
    });

    test("should return data stream response", async () => {
      // Act
      const result = await POST(mockRequest);

      // Assert
      expect(mockStreamTextResult.toDataStreamResponse).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toBe("mock-data-stream");
    });
  });

  describe("Error Handling", () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockAuth.mockResolvedValue({ userId: "user123" });
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test("should handle JSON parsing errors", async () => {
      // Arrange
      mockRequest.json.mockRejectedValue(new Error("Invalid JSON"));

      // Act
      const result = await POST(mockRequest);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Chat completion error:",
        expect.any(Error),
      );
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    });

    test("should handle OramaClient initialization errors", async () => {
      // Arrange
      mockRequest.json.mockResolvedValue({
        messages: [{ id: "1", role: "user", content: "test" }],
        accountId: "account123",
      });
      mockOramaInstance.initialize.mockRejectedValue(new Error("Init failed"));

      // Act
      await POST(mockRequest);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Chat completion error:",
        expect.any(Error),
      );
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    });

    test("should handle vector search errors", async () => {
      // Arrange
      mockRequest.json.mockResolvedValue({
        messages: [{ id: "1", role: "user", content: "test" }],
        accountId: "account123",
      });
      mockOramaInstance.vectorSearch.mockRejectedValue(
        new Error("Search failed"),
      );

      // Act
      await POST(mockRequest);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Chat completion error:",
        expect.any(Error),
      );
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    });

    test("should handle streamText errors", async () => {
      // Arrange
      mockRequest.json.mockResolvedValue({
        messages: [{ id: "1", role: "user", content: "test" }],
        accountId: "account123",
      });
      mockStreamText.mockImplementation(() => {
        throw new Error("AI service error");
      });

      // Act
      await POST(mockRequest);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Chat completion error:",
        expect.any(Error),
      );
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    });

    test("should handle auth errors", async () => {
      // Arrange
      mockAuth.mockRejectedValue(new Error("Auth service down"));

      // Act
      await POST(mockRequest);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Chat completion error:",
        expect.any(Error),
      );
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    });
  });
});
