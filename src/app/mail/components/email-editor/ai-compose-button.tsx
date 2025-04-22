import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { convertHtmlToPlainText } from "@/utils/convertHtmlToPlainText";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useState } from "react";

import { api } from "@/trpc/react";
import { useAtomValue } from "jotai";
import { accountDetails, threadAtom } from "../../atoms";

type Props = {
  isComposing: boolean;
  onGenerate: (token: string) => void;
};

const AIComposeButton = ({ isComposing, onGenerate }: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");

  const accountInfo = useAtomValue(accountDetails);
  const thread = useAtomValue(threadAtom);
  const emailContent = thread?.emails
    .map((msg) => {
      const plain = convertHtmlToPlainText(msg.body ?? "");
      return `From: ${msg.from.name}\nDate: ${msg.sentAt.toISOString()}\n---\n${msg.subject}\n---\n${plain.trim()}\n`;
    })
    .join("\n---\n");

  const context = `
            You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by providing suggestions and relevant information based on the context of their previous emails.
            
            THE TIME NOW IS ${new Date().toLocaleString()}
            
            START CONTEXT BLOCK
            ${emailContent}
            END OF CONTEXT BLOCK
            
            When responding, please keep in mind:
            - Be helpful, clever, and articulate. 
            - Rely on the provided email context to inform your response.
            - If the context does not contain enough information to fully address the prompt, politely give a draft response.
            - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
            - Do not invent or speculate about anything that is not directly supported by the email context.
            - Keep your response focused and relevant to the user's prompt.
            - Don't add fluff like 'Heres your email' or 'Here's your email' or anything like that.
            - Directly output the email, no need to say 'Here is your email' or anything like that.
            - No need to output subject


            My name is ${accountInfo?.name} and my email address is ${accountInfo?.emailAddress}
            `;

  const composeEmail = api.chat.composeEmail.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Wait for the mutation to complete and update the response
      const res = await composeEmail.mutateAsync({
        prompt,
        context,
        temperature: 0.7,
      });
      onGenerate(res);
    } catch (error) {
      console.error("Error occurred during mutation:", error);
    }
  };
  const handleButtonClick = async (e: React.MouseEvent) => {
    setOpen(false); // Close the dialog after the request is finished
    await handleSubmit(e); // Await the submission process
    // console.log("Run AI");
    setPrompt(""); // Reset the prompt
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant={"outline"} onClick={() => setOpen(true)}>
          <Bot className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>
            AI will compose reply based on the context of your email thread
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={handleButtonClick} // Use the async function here
              disabled={isComposing} // Optionally, disable the button when composing
            >
              {isComposing ? "Composing..." : "Ask AI"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;
