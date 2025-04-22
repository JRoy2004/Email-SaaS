import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useAtomValue } from "jotai";
import { threadAtom } from "../atoms";

import { convertHtmlToPlainText } from "@/utils/convertHtmlToPlainText";
import { api } from "@/trpc/react";
import { useState } from "react";

const AISummarizer = ({
  setSummary,
}: {
  setSummary: (summary: string) => void;
}) => {
  const threadItem = useAtomValue(threadAtom);
  const [summarizing, setSummarizing] = useState<boolean>(false);

  const emailContent = threadItem?.emails
    .map((msg) => {
      const plain = convertHtmlToPlainText(msg.body ?? "");
      return `From: ${msg.from.name}\nDate: ${msg.sentAt.toISOString()}\n---\n${msg.subject}\n---\n${plain.trim()}\n`;
    })
    .join("\n---\n");

  const context = `
            You are an AI email assistant embedded in an email client app. Your purpose is to generate summary based on the context of the previous emails.
            
            THE TIME NOW IS ${new Date().toLocaleString()}
            
            START CONTEXT BLOCK
            ${emailContent}
            END OF CONTEXT BLOCK
            
            When responding, please keep in mind:
            - Be helpful, clever, and articulate. 
            - Rely on the provided email context to inform your response.
            - If the context does not contain enough information to fully address the prompt, Do not add anything extra information from your end.
            - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
            - Do not invent or speculate about anything that is not directly supported by the email context.
            - Keep your response focused and relevant to the context only.
            - Your response should not be more than 100 words.
            - Don't add fluff like 'Heres your email' or 'Here's your email' or anything like that.
            - Directly output the email, no need to say 'Here is your email' or anything like that.
            - No need to output subject


           `;

  const composeEmail = api.chat.summarizeThread.useMutation();
  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSummarizing(true);
    try {
      // Wait for the mutation to complete and update the response
      const res = await composeEmail.mutateAsync({
        context,
        temperature: 0.7,
      });
      setSummary(res);
    } catch (error) {
      console.error("Error occurred during mutation:", error);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div>
      <Button onClick={handleSubmit}>
        {summarizing ? (
          <div>Summarizing...</div>
        ) : (
          <div className="flex flex-1 flex-row gap-1">
            summarize <Brain />
          </div>
        )}
      </Button>
    </div>
  );
};

export default AISummarizer;
