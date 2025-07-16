import { openaiInstance } from "./openai";
export async function getEmbeddings(text: string): Promise<number[]> {
  if (!text?.trim()) {
    console.warn("Empty or invalid text input for embedding.");
    return [];
  }
  try {
    const response = await openaiInstance.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });
    return response.data[0]?.embedding ?? [];
  } catch (error) {
    console.error("Error while generating embeddings: ", error);
    return [];
  }
}
