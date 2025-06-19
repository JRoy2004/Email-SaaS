import { getPlainText } from "@/utils/getPlainText";

describe("getPlainText", () => {
  it("should return empty string for empty input", () => {
    expect(getPlainText("")).toBe("");
  });

  it("should return plain text from simple HTML", () => {
    const html = "<p>Hello World</p>";
    expect(getPlainText(html)).toBe("Hello World");
  });

  it("should return plain text with nested HTML", () => {
    const html =
      "<div><p><strong>Bold</strong> and <em>italic</em> text</p></div>";
    expect(getPlainText(html)).toBe("Bold and italic text");
  });

  it("should handle malformed HTML gracefully", () => {
    const html = "<div><p>Unclosed tag";
    expect(getPlainText(html)).toBe("Unclosed tag");
  });

  it("should return text content even if special characters are present", () => {
    const html = "<p>Tom & Jerry &copy; 2024</p>";
    expect(getPlainText(html)).toBe("Tom & Jerry © 2024");
  });

  it("should remove script and style content", () => {
    const html = `
      <style>body { color: red; }</style>
      <script>alert('hi');</script>
      <p>Visible Text</p>
    `;
    expect(getPlainText(html)).toBe("Visible Text");
  });

  it("should return content from multiple HTML tags", () => {
    const html = "<h1>Title</h1><p>Paragraph</p>";
    expect(getPlainText(html)).toBe("TitleParagraph");
  });

  it("should return text from HTML entities", () => {
    const html = "<p>5 &lt; 10 and 10 &gt; 5</p>";
    expect(getPlainText(html)).toBe("5 < 10 and 10 > 5");
  });

  it("should handle line breaks and white space", () => {
    const html = "<div>Line 1<br>Line 2</div>";
    expect(getPlainText(html)).toBe("Line 1Line 2"); // DOMParser does not insert new lines for <br>
  });

  it("should handle HTML with only tags and no text", () => {
    const html = "<div><span></span></div>";
    expect(getPlainText(html)).toBe("");
  });
});
