import { convertHtmlToPlainText } from "@/utils/convertHtmlToPlainText";

describe("convertHtmlToPlainText", () => {
  it("should remove script, style, and noscript tags", () => {
    const html = `
      <div>Hello <strong>World</strong></div>
      <script>alert("Hi")</script>
      <style>div { color: red; }</style>
      <noscript>JavaScript required</noscript>
    `;
    const result = convertHtmlToPlainText(html);
    expect(result).toContain("Hello World");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("color: red");
    expect(result).not.toContain("JavaScript required");
  });

  it("should strip HTML tags and preserve text content", () => {
    const html = `<h1>Title</h1><p>This is a <strong>paragraph</strong>.</p>`;
    const result = convertHtmlToPlainText(html);
    expect(result).toMatch(/title/i);
    expect(result).toContain("This is a paragraph.");
  });

  it("should skip image tags", () => {
    const html = `<p>Here is an image: <img src="image.jpg" alt="test image" /></p>`;
    const result = convertHtmlToPlainText(html);
    expect(result).toContain("Here is an image:");
    expect(result).not.toContain("test image");
    expect(result).not.toContain("image.jpg");
  });

  it("should not show href when link text is same", () => {
    const html = `<a href="https://example.com">https://example.com</a>`;
    const result = convertHtmlToPlainText(html);
    expect(result).toBe("https://example.com");
  });

  it("should preserve newlines between block elements", () => {
    const html = `<h1>Header</h1><p>Paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul>`;
    const result = convertHtmlToPlainText(html);
    const lines = result.split("\n").map((line) => line.trim());
    expect(lines).toContain("HEADER");
    expect(lines).toContain("Paragraph");
    expect(lines).toContain("* Item 1");
    expect(lines).toContain("* Item 2");
  });

  it("should return trimmed result", () => {
    const html = `   <div>   Hello World   </div>   `;
    const result = convertHtmlToPlainText(html);
    expect(result).toBe("Hello World");
  });
});
