import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import { accountDetails, threadAtom, threadIdAtom } from "../atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";

import { addDays } from "date-fns/addDays";
import { addHours } from "date-fns/addHours";
import { format } from "date-fns/format";
import { nextSaturday } from "date-fns/nextSaturday";

import {
  Archive,
  ArchiveX,
  Clock,
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { ScrollArea } from "@/components/ui/scroll-area";

import ReplyBox from "./reply-box";
import AISummarizer from "./ai-summarizer";

const MailDisplay = ({ isMobile }: { isMobile: boolean }) => {
  const setThreadId = useSetAtom(threadIdAtom);
  const threadItem = useAtomValue(threadAtom);
  const accountInfo = useAtomValue(accountDetails);
  const accountEmail = accountInfo?.emailAddress;
  // const today = new Date();

  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    setSummary(""); // Reset summary when threadItem changes
  }, [threadItem]);

  return (
    <div className="flex flex-col">
      <div className="sticky z-20 flex items-center p-2">
        <div className="flex items-center gap-2">
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
            <TooltipContent className="rounded-lg bg-black p-1 text-xs text-white dark:bg-white dark:text-black">
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
          {/* <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!threadItem}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div> 
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip> */}
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
            <div className="z-2 sticky top-0">
              <div className="z-2 sticky top-0 flex flex-row justify-between border-white/30 bg-white/20 p-4 font-bold backdrop-blur-md dark:border-white/10 dark:bg-black/20">
                {threadItem.emails.at(-1)!.subject}
                <AISummarizer setSummary={setSummary} />
              </div>
              <Separator className="mt-auto" />
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-2 text-sm shadow-sm",
                  "border border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300",
                  summary ? "" : "hidden",
                )}
              >
                <span>{summary}</span>
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
            </div>
            <Separator className="mt-auto" />
            {threadItem?.emails.map((mail) => (
              <div key={mail.id} className="-z-10 flex flex-1 flex-col">
                <div className="-z-10 flex items-start p-2">
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
                    <div className="grid gap-1">
                      <div className="pr-4 font-semibold">{mail.subject}</div>
                      {accountEmail === mail.from.address ? (
                        <div className="line-clamp-1 text-xs font-semibold text-blue-600">
                          Me
                        </div>
                      ) : (
                        <div>
                          <div className="line-clamp-1 text-xs">
                            From: {mail.from.name}
                          </div>
                          <div className="line-clamp-1 text-xs sm:pl-2 lg:pl-9">
                            {mail.from.address}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {mail.sentAt && (
                    <div className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(mail.sentAt), "PPpp")}
                    </div>
                  )}
                </div>
                <Separator />
                <div
                  className="-z-10 min-h-32 p-4 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(mail.body!),
                  }}
                />
                {/* <Separator className="mt-auto" /> */}
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
