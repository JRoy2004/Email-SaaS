import OpenAI from "openai";

export const openaiInstance = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
