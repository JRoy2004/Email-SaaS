// Mock openaiInstance
const mockCreate = jest.fn();
jest.mock("@/lib/openai", () => ({
  openaiInstance: {
    embeddings: {
      create: mockCreate,
    },
  },
}));

// Mock console
const mockConsole = {
  warn: jest.fn(),
  error: jest.fn(),
};

global.console = mockConsole as any;
const { getEmbeddings } = require("@/lib/embeddings"); // adjust import as needed

describe("getEmbeddings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid embedding array for normal text", async () => {
    const mockEmbedding = Array(5).fill(0.42); // short mock
    mockCreate.mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    const result = await getEmbeddings("Hello world");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "Hello world",
    });
    expect(result).toEqual(mockEmbedding);
  });

  it("should remove newlines from input text", async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    mockCreate.mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    const result = await getEmbeddings("Hello\nworld");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "Hello world", // \n replaced with space
    });
    expect(result).toEqual(mockEmbedding);
  });

  it("should return empty array and log warning for empty input", async () => {
    const result = await getEmbeddings("   ");

    expect(mockCreate).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "Empty or invalid text input for embedding.",
    );
    expect(result).toEqual([]);
  });

  it("should handle error from OpenAI and return empty array", async () => {
    const error = new Error("API down");
    mockCreate.mockRejectedValue(error);

    const result = await getEmbeddings("Valid input");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error while generating embeddings: ",
      error,
    );
    expect(result).toEqual([]);
  });

  it("should return empty array if response has no data", async () => {
    mockCreate.mockResolvedValue({
      data: [],
    });

    const result = await getEmbeddings("Something");

    expect(result).toEqual([]);
  });
});
