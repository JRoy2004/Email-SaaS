import { load } from "cheerio";
import { convert } from "html-to-text";

/**
 * Converts HTML to clean plain text using cheerio + html-to-text
 * @param html - The raw HTML string to convert
 * @returns Plain text string
 */
export function convertHtmlToPlainText(html: string): string {
  const $ = load(html);

  // Optional: Remove unwanted sections (like scripts or styles)
  $("script, style, noscript").remove();

  const cleanedHtml = $.html();

  const text = convert(cleanedHtml, {
    wordwrap: 130,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "img", format: "skip" }, // Skip images
    ],
    preserveNewlines: true,
    uppercaseHeadings: false,
  });

  return text.trim();
}
