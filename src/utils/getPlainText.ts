export const getPlainText = (html: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  console.log(doc);
  return doc.body.textContent ?? "";
};
