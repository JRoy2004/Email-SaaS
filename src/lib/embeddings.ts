import { openaiInstance } from "./openai";

/**
 * Generates a vector embedding for a given input text using OpenAI's embedding model.
 *
 * This function uses the "text-embedding-3-small" model to convert a plain text string
 * into a fixed-size numerical vector representation. It performs basic validation and
 * logs warnings for empty or invalid input. If the OpenAI API call fails, it catches
 * the error and returns an empty array.
 *
 * @param {string} text - The input text for which the embedding vector is to be generated.
 * @returns {Promise<number[]>} A promise that resolves to an array of numbers representing the embedding vector.
 *
 * @example
 * const vector = await getEmbeddings("Hello world");
 * console.log(vector); // [0.015, -0.023, ...]
 */
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
