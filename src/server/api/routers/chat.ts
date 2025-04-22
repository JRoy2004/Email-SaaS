import { z } from "zod";
import { openai } from "@/lib/openai";
import { createTRPCRouter, privateProcedure } from "../trpc";

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const chatRouter = createTRPCRouter({
  composeEmail: privateProcedure
    .input(
      z.object({
        context: z.string().optional(),
        prompt: z.string(),
        temperature: z.number().min(0).max(2).default(0.7),
      }),
    )
    .mutation(async ({ input }) => {
      const messages: ChatCompletionMessageParam[] = [
        input.context ? { role: "system", content: input.context } : null,
        { role: "user", content: input.prompt },
      ].filter((m): m is ChatCompletionMessageParam => m !== null);

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages,
        temperature: input.temperature,
      });

      return completion.choices[0]?.message?.content ?? "No response.";
    }),
  summarizeThread: privateProcedure
    .input(
      z.object({
        context: z.string(),
        temperature: z.number().min(0).max(2).default(0.7),
      }),
    )
    .mutation(async ({ input }) => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "system", content: input.context }],
        temperature: input.temperature,
      });
      return completion.choices[0]?.message?.content ?? "No response.";
    }),
});
