"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { useState } from "react";

// TipTap Extensions
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

import { FontFamily } from "./extensions/FontFamily";
import { FontSize } from "./extensions/FontSize";

// UI Components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Components
import EditorMenuBar from "./menu-bar";
import TagInput from "./tag-input";
import AIComposeButton from "./ai-compose-button";

type Props = {
  subject: string;
  setSubject: (value: string) => void;
  toValues: { label: string; value: string }[];
  setToValues: (value: { label: string; value: string }[]) => void;
  ccValues: { label: string; value: string }[];
  setCcValues: (value: { label: string; value: string }[]) => void;
  to: string[];
  handleSend: (value: string) => void;
  isSending: boolean;
  defaultToolbarExpanded?: boolean;
};

const EmailEditor = ({
  subject,
  setSubject,
  toValues,
  setToValues,
  ccValues,
  setCcValues,
  to,
  handleSend,
  isSending,
  defaultToolbarExpanded,
}: Props) => {
  const [value, setValue] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(
    defaultToolbarExpanded ?? false,
  );
  const [shouldConfirm, setShouldConfirm] = useState<boolean>(false);

  const editor = useEditor({
    autofocus: false,
    content: "",
    immediatelyRender: false, // Explicitly set to false to avoid hydration issues in SSR environments
    extensions: [
      StarterKit,

      Link,
      Typography,

      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      Highlight,
      TextStyle,
      FontFamily,
      FontSize,
      Placeholder.configure({
        placeholder: "Write something",
      }),
    ],
    onUpdate: ({ editor }) => {
      console.log(editor.getHTML());
      setValue(editor.getHTML());
    },
  });

  if (!editor) return null;

  const onGenerate = (token: string) => {
    editor.commands.insertContent(token);
  };

  const handleAction = () => {
    if (!subject.trim()) setShouldConfirm(true);
    else {
      performAction();
    }
  };
  const performAction = () => {
    editor?.commands?.clearContent();
    handleSend(value);
    console.log("EMAIL SEND");
    setShouldConfirm(false);
  };

  return (
    <div>
      <div className="flex border-b p-4 py-2">
        <EditorMenuBar editor={editor} />
      </div>

      <div className="space-y-2 p-4 pb-1">
        {expanded && (
          <>
            <TagInput
              label="To"
              onChange={setToValues}
              placeholder="Add Recipients"
              values={toValues}
            />
            <TagInput
              label="Cc"
              onChange={setCcValues}
              placeholder="Add Recipients"
              values={ccValues}
            />
            <Input
              id="subject"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <div
            className="z-2 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="font-medium text-green-600">Draft </span>
            <span>to {to.join(", ")}</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AIComposeButton
                  isComposing={defaultToolbarExpanded ?? false}
                  onGenerate={onGenerate}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Compose</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <Separator />
      <ScrollArea className="pose h-[150px] w-full px-4 py-0">
        <EditorContent
          editor={editor}
          value={value}
          className="prose prose-sm max-w-none py-0 dark:prose-invert sm:prose lg:prose-lg"
        />
      </ScrollArea>

      <Separator />

      <div className="flex flex-row-reverse items-center px-4 py-3">
        <Button onClick={handleAction} disabled={isSending}>
          Send
        </Button>
        <AlertDialog open={shouldConfirm} onOpenChange={setShouldConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you absolutely confirm to send an Email with
                <span className="text-red-500">Empty</span> Subject?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>
                <Button onClick={performAction}>Continue</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default EmailEditor;
