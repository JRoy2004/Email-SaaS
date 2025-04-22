import { Fragment, type ComponentProps } from "react";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import useThreads from "../hooks/useThreads";
import { useAtom } from "jotai";
import { threadIdAtom } from "../atoms";
import { useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ThreadList = ({ done }: { done: boolean }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { threads, isFetching, refetch, totalPages } = useThreads({
    page: currentPage,
    done: done,
  });

  const [threadId, setthreadId] = useAtom(threadIdAtom);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const groupedThreads = threads?.reduce(
    (acc, thread) => {
      const date = format(thread.emails[0]?.sentAt ?? new Date(), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(thread);
      return acc;
    },
    {} as Record<string, typeof threads>,
  );

  const systemLabelList = (
    thread: NonNullable<typeof threads>[number]["emails"],
  ) => {
    if (!thread) return [];

    // console.log(thread[0]?.sysClassifications);
    // Process thread labels here
    const emailTags = new Set<string>();

    thread.forEach((email) => {
      email.sysClassifications.forEach((label) => {
        emailTags.add(label);
      });
    });

    return [...emailTags];
  };

  return (
    <div>
      <Pagination>
        <PaginationContent className="justify-end">
          <PaginationItem>
            <PaginationPrevious
              onClick={
                currentPage > 1
                  ? () => handlePageChange(currentPage - 1)
                  : undefined
              }
              aria-disabled={currentPage === 1}
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
          {currentPage > 2 && <PaginationEllipsis />}
          {/* Previous Page (if exists) */}
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(currentPage - 1)}
                className="text-xs"
              >
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Active Page */}
          <PaginationItem>
            <PaginationLink href="#" isActive className="text-xs">
              {currentPage}
            </PaginationLink>
          </PaginationItem>

          {/* Next Page (if exists) */}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(currentPage + 1)}
                className="text-xs"
              >
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {currentPage < totalPages - 1 && <PaginationEllipsis />}

          <PaginationItem>
            <PaginationNext
              onClick={
                currentPage < totalPages
                  ? () => handlePageChange(currentPage + 1)
                  : undefined
              }
              aria-disabled={currentPage === totalPages}
              className={cn(
                currentPage === totalPages && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <ScrollArea className="h-[85vh]">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {Object.entries(groupedThreads ?? {}).map(([date, threads]) => (
            <Fragment key={date}>
              <div className="mt-5 text-xs font-medium text-muted-foreground first:mt-0">
                {date}
              </div>
              {threads.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setthreadId(item.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                    { "border-blue-500 bg-accent": item.id === threadId },
                  )}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex w-[80%] items-center">
                        <div className="font-semibold">{item.subject}</div>
                      </div>
                      <div className="ml-auto text-xs">
                        {formatDistanceToNow(new Date(item.lastMessageDate), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {(item.emails.at(-1)?.bodySnippet ?? "").substring(0, 300)}
                  </div>
                  <div>
                    {item.emails[0]?.sysClassifications && (
                      <div className="flex items-center gap-2">
                        {systemLabelList(item.emails).map((label) => {
                          if (label === "unread") return null;
                          return (
                            <Badge
                              key={label}
                              variant={gerBadgeVariantFormLabel(label)}
                            >
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

function gerBadgeVariantFormLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  switch (label) {
    case "Important":
      return "destructive";
    case "Work":
      return "default";
    case "Personal":
      return "default";
    default:
      return "secondary";
  }
}

export default ThreadList;
