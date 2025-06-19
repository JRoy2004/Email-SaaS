describe("Sample Test Suite", () => {
  it("should pass a basic math test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should check a string match", () => {
    const message = "Hello, Jest!";
    expect(message).toContain("Jest");
  });
});
