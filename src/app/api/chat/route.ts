import { streamText, type Message } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OramaClient } from "@/lib/orama";

// Optional for Vercel (if using Edge Runtime)
// export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { messages, accountId }: { messages: Message[]; accountId: string } =
      await req.json();

    const oramaClient = new OramaClient(accountId);
    await oramaClient.initialize();

    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content ?? "";

    const context = await oramaClient.vectorSearch({ prompt: query });

    const prompt: Message = {
      id: new Date().toISOString(),
      role: "system",
      content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
THE TIME NOW IS ${new Date().toLocaleString()}

START CONTEXT BLOCK
${context.hits.map((hit) => JSON.stringify(hit.document)).join("\n")}
END OF CONTEXT BLOCK

When responding, please keep in mind:
- Be helpful, clever, and articulate.
- Rely on the provided email context to inform your responses.
- If the context does not contain enough information to answer a question, politely say you don't have enough information.
- Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
- Do not invent or speculate about anything that is not directly supported by the email context.
- Keep your responses concise and relevant to the user's questions or the email being composed.`,
    };
    const result = streamText({
      model: openai.chat("gpt-4"),
      messages: [prompt, ...messages],
    });
    console.log(result.toTextStreamResponse());

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat completion error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
