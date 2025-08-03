// Mocks
const mockCreate = jest.fn();
const mockInsert = jest.fn();
const mockSearch = jest.fn();
const mockRemove = jest.fn();
const mockPersist = jest.fn();
const mockRestore = jest.fn();
const mockGetEmbeddings = jest.fn();

jest.mock("@orama/orama", () => ({
  create: mockCreate,
  insert: mockInsert,
  search: mockSearch,
  remove: mockRemove,
}));

jest.mock("@orama/plugin-data-persistence", () => ({
  persist: mockPersist,
  restore: mockRestore,
}));

const mockDb = {
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};
jest.mock("@/server/db", () => ({
  db: mockDb,
}));

jest.mock("@/lib/embeddings", () => ({
  getEmbeddings: mockGetEmbeddings,
}));

// Import after mocks
const { OramaClient } = require("@/lib/orama"); // Adjust path as needed

describe("OramaClient", () => {
  const mockAccountId = "acc-123";
  const mockOramaInstance = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialize", () => {
    it("restores index from DB if present", async () => {
      mockDb.account.findUnique.mockResolvedValue({
        oramaIndex: "serialized-index",
      });
      mockRestore.mockResolvedValue(mockOramaInstance);

      const client = new OramaClient(mockAccountId);
      await client.initialize();

      expect(mockDb.account.findUnique).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        select: { oramaIndex: true },
      });
      expect(mockRestore).toHaveBeenCalledWith("json", "serialized-index");
    });

    it("creates new index if none exists in DB", async () => {
      mockDb.account.findUnique.mockResolvedValue({
        oramaIndex: null,
      });
      mockCreate.mockReturnValue(mockOramaInstance);
      mockPersist.mockResolvedValue("new-index");

      const client = new OramaClient(mockAccountId);
      await client.initialize();

      expect(mockCreate).toHaveBeenCalled();
      expect(mockPersist).toHaveBeenCalledWith(mockOramaInstance, "json");
      expect(mockDb.account.update).toHaveBeenCalledWith({
        where: { id: mockAccountId },
        data: { oramaIndex: "new-index" },
      });
    });

    it("throws error if account is not found", async () => {
      mockDb.account.findUnique.mockResolvedValue(null);

      const client = new OramaClient(mockAccountId);
      await expect(client.initialize()).rejects.toThrow("Account not found");
    });
  });

  describe("insert", () => {
    it("inserts a document and saves the index", async () => {
      const client = new OramaClient(mockAccountId);
      client["orama"] = mockOramaInstance;
      mockPersist.mockResolvedValue("saved-index");

      await client.insert({
        id: "1",
        subject: "Sub",
        body: "",
        from: "",
        to: [],
        sentAt: "",
        embeddings: [],
        threadId: "",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        mockOramaInstance,
        expect.any(Object),
      );
      expect(mockPersist).toHaveBeenCalled();
      expect(mockDb.account.update).toHaveBeenCalled();
    });
  });

  describe("vectorSearch", () => {
    it("returns vector search results using embeddings", async () => {
      mockGetEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
      mockSearch.mockResolvedValue({ hits: ["result1", "result2"] });

      const client = new OramaClient(mockAccountId);
      client["orama"] = mockOramaInstance;

      const results = await client.vectorSearch({
        prompt: "test prompt",
        numResults: 5,
      });

      expect(mockGetEmbeddings).toHaveBeenCalledWith("test prompt");
      expect(mockSearch).toHaveBeenCalledWith(mockOramaInstance, {
        mode: "hybrid",
        term: "test prompt",
        vector: { value: [0.1, 0.2, 0.3], property: "embeddings" },
        similarity: 0.8,
        limit: 5,
      });
      expect(results.hits).toEqual(["result1", "result2"]);
    });
  });

  describe("search", () => {
    it("performs a term-based search", async () => {
      mockSearch.mockResolvedValue({ hits: ["term1", "term2"] });

      const client = new OramaClient(mockAccountId);
      client["orama"] = mockOramaInstance;

      const results = await client.search({ term: "keyword" });

      expect(mockSearch).toHaveBeenCalledWith(mockOramaInstance, {
        term: "keyword",
        tolerance: 1,
      });
      expect(results.hits).toEqual(["term1", "term2"]);
    });
  });

  describe("removeThread", () => {
    it("removes documents matching threadId", async () => {
      const mockHits = [
        { document: { id: "doc1" } },
        { document: { id: "doc2" } },
      ];
      mockSearch.mockResolvedValue({ hits: mockHits });
      mockPersist.mockResolvedValue("saved-index");

      const client = new OramaClient(mockAccountId);
      client["orama"] = mockOramaInstance;

      await client.removeThread("thread-123");

      expect(mockSearch).toHaveBeenCalledWith(mockOramaInstance, {
        term: "thread-123",
        properties: ["threadId"],
        tolerance: 0,
      });

      expect(mockRemove).toHaveBeenCalledWith(mockOramaInstance, "doc1");
      expect(mockRemove).toHaveBeenCalledWith(mockOramaInstance, "doc2");
      expect(mockDb.account.update).toHaveBeenCalled();
    });
  });
});
