export const getPlainText = (html: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  return doc.body.textContent?.trim() ?? "";
};
