import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import { accountDetails, threadAtom, threadIdAtom } from "../atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { format } from "date-fns/format";

import {
  ArchiveX,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  ChevronLeft,
} from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { ScrollArea } from "@/components/ui/scroll-area";

import ReplyBox from "./reply-box";
import AISummarizer from "./ai-summarizer";
import { boolean } from "zod";

const MailDisplay = ({ isMobile }: { isMobile: boolean }) => {
  const setThreadId = useSetAtom(threadIdAtom);
  const threadItem = useAtomValue(threadAtom);
  const accountInfo = useAtomValue(accountDetails);
  const accountEmail = accountInfo?.emailAddress;
  // const today = new Date();

  const [summary, setSummary] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    setSummary(""); // Reset summary when threadItem changes
  }, [threadItem]);

  return (
    <div className="sm:text-md flex flex-col text-sm">
      <div className="items-centerp-2 sticky z-20 flex">
        <div className="z-50 flex items-center gap-2">
          {/* back-arrow only on mobile */}
          {isMobile && (
            <button
              onClick={() => {
                setThreadId(null);
              }}
              className="rounded-full p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!threadItem}>
                <ArchiveX className="h-4 w-4" />
                {/* <span className="sr-only">Move to junk</span> */}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="z-50 rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black"
            >
              Move to junk
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!threadItem}>
                <Trash2 className="h-4 w-4" />
                {/* <span className="sr-only">Move to trash</span> */}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black">
              Move to trash
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!threadItem}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black">
              Reply
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!threadItem}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black">
              Reply all
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!threadItem}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black">
              Forward
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!threadItem}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {threadItem ? (
        <div className="max-w-full">
          <ScrollArea className="h-[70vh]">
            <div className="sticky top-0 z-10">
              <div className="flex flex-col gap-2 border-white/30 bg-white/20 p-4 font-bold backdrop-blur-md dark:border-white/10 dark:bg-black/20 sm:flex-row sm:justify-between">
                <div className="">{threadItem.subject}</div>
                <AISummarizer setSummary={setSummary} />
              </div>{" "}
              {!isMobile && (
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-2 text-sm shadow-sm",
                    "border border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300",
                    summary ? "" : "hidden",
                  )}
                >
                  <span className="text-wrap break-words">{summary}</span>
                  <button
                    onClick={() => setSummary("")}
                    className="group rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-red-500 hover:text-white dark:bg-neutral-700 dark:text-gray-400 dark:hover:bg-red-500 dark:hover:text-white">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
              <Separator className="mt-auto" />
            </div>
            {isMobile && (
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-2 text-sm shadow-sm",
                  "border border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300",
                  summary ? "" : "hidden",
                )}
              >
                <span className="text-wrap break-words">{summary}</span>
                <button
                  onClick={() => setSummary("")}
                  className="group rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors hover:bg-red-500 hover:text-white dark:bg-neutral-700 dark:text-gray-400 dark:hover:bg-red-500 dark:hover:text-white">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            )}
            <Separator className="mt-auto" />
            {threadItem?.emails.map((mail) => (
              <div key={mail.id} className="flex w-full flex-1 flex-col">
                <div className="flex flex-col items-start overflow-x-hidden p-2 sm:flex-row">
                  <div className="flex items-start gap-4 text-sm">
                    <Avatar
                      className={cn(
                        accountEmail === mail.from.address ? "hidden" : "",
                      )}
                    >
                      <AvatarImage alt="avatar" />
                      <AvatarFallback>
                        {mail.from
                          .name!.split(" ")
                          .map((chunk) => chunk[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 overflow-hidden">
                      <div className="break-words pr-4 text-xs font-semibold">
                        {mail.subject}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-col">
                          {accountEmail === mail.from.address ? (
                            <div className="line-clamp-1 text-xs font-semibold text-blue-600">
                              Me
                            </div>
                          ) : (
                            <div
                              className="relative z-[100] cursor-pointer overflow-hidden"
                              onClick={() => {
                                console.log("Expanded changed");
                                setExpanded((pre) => !pre);
                              }}
                            >
                              <div className="line-clamp-1 text-xs">
                                From: {mail.from.name}
                              </div>
                              <div className="line-clamp-1 text-xs sm:pl-9">
                                {mail.from.address}
                              </div>

                              {expanded && (
                                <div className="line-clamp-1 flex gap-1 text-xs">
                                  To:{" "}
                                  {mail.to.map((add) => (
                                    <div key={add.id}>
                                      {add.name && (
                                        <div className="line-clamp-1 text-xs sm:pl-4">
                                          {add.name}
                                        </div>
                                      )}
                                      <div className="line-clamp-1 text-xs sm:pl-4">
                                        {add.address}
                                      </div>
                                    </div>
                                  ))}
                                  {mail.cc.length > 0 && (
                                    <div className="line-clamp-1 flex gap-1 text-xs">
                                      To:{" "}
                                      {mail.to.map((add) => (
                                        <div key={add.id}>
                                          {add.name && (
                                            <div className="line-clamp-1 text-xs sm:pl-4">
                                              {add.name}
                                            </div>
                                          )}
                                          <div className="line-clamp-1 text-xs sm:pl-4">
                                            {add.address}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {mail.sentAt && (
                    <div className="ml-auto mt-2 whitespace-nowrap text-xs text-muted-foreground sm:mt-0">
                      {format(new Date(mail.sentAt), "PPpp")}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex w-screen flex-1 flex-col items-center justify-center md:w-full">
                  <div
                    className="flex flex-col p-2 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(mail.body!),
                    }}
                  />
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
      <Separator className="mt-auto" />
      <div>
        <ReplyBox />
      </div>
    </div>
  );
};

export default MailDisplay;
