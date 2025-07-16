"use client";
import { Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

interface AskAIProps {
  isCollapsed: boolean;
}

export default function AskAI({ isCollapsed }: AskAIProps) {
  const [accountId] = useLocalStorage("accountId", "");

  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    body: { accountId },
    onError: (error) => {
      if (error?.message?.includes("Limit reached")) {
        toast.error(
          "You have reached the limit for today. Please upgrade to pro to ask as many questions as you want",
        );
      }
    },
    initialMessages: [],
  });
  console.log(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessageId, setNewMessageIds] = useState<string>();
  const previousMessagesRef = useRef<typeof messages>([]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setNewMessageIds(latestMessage?.id);

      const timeoutId = setTimeout(() => setNewMessageIds(""), 600);

      return () => clearTimeout(timeoutId);
    }

    previousMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (input.trim()) {
      handleSubmit(e);
    }
  };
  if (isCollapsed) return;
  return (
    <div className="mx-auto flex h-[50vh] max-w-md flex-col">
      {/* Messages */}
      <div className="-z-2 flex-1 space-y-4 overflow-y-auto bg-white p-4 dark:bg-black">
        {messages.map((message) => {
          const isNewMessage = newMessageId === message.id;
          const animationClass = isNewMessage
            ? message.role === "user"
              ? "animate-pop-in-right"
              : "animate-pop-in-left"
            : "";

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } ${animationClass}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 lg:max-w-md ${
                  message.role === "user"
                    ? "rounded-br-none bg-blue-500 text-white dark:bg-blue-900"
                    : "rounded-bl-none bg-gray-200 text-gray-800 shadow-sm dark:bg-slate-700 dark:text-white"
                } ${isNewMessage ? "animate-pulse-once" : ""}`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="mt-1 flex items-center justify-end">
                  <span
                    className={`text-xs ${
                      message.role === "user"
                        ? "text-green-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message?.createdAt?.toISOString().slice(11, 19)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="relative mt-4 flex w-full">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask AI anything about your emails"
          className="relative h-9 flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none placeholder:text-[13px] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700"
        />

        <button
          type="submit"
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <Send className="size-4 text-gray-500 dark:text-gray-300" />
        </button>
      </form>
    </div>
  );
}
