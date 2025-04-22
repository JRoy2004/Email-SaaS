import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import { links } from "@/Constants";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "usehooks-ts";

import { api } from "@/trpc/react";

interface sidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: sidebarProps) => {
  const [accountId] = useLocalStorage<string>("accountId", "");

  const [tab, setTab] = useLocalStorage<
    "inbox" | "drafts" | "sent" | "junk" | "trash"
  >("email-tabs", "inbox");

  const { data, isLoading, error } = api.account.getThreadsCount.useQuery({
    accountId,
  });

  if (!data) return <div></div>;
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const {
    inboxStatusTrue = 0,
    draftStatusTrue = 0,
    sentStatusTrue = 0,
    trashStatusTrue = 0,
    junkStatusTrue = 0,
  } = data ?? {};

  // Create a mapping between link titles and their respective status values
  const statusMap: Record<string, number> = {
    inbox: inboxStatusTrue,
    drafts: draftStatusTrue,
    sent: sentStatusTrue,
    trash: trashStatusTrue,
    junk: junkStatusTrue,
  };

  const linkItems = links.map((link) => {
    return {
      ...link,
      label: statusMap[link.title.toLowerCase()] ?? (0n as bigint),
    };
  });

  // console.log(linkItems);

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {linkItems.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <span
                  onClick={() => setTab(link.title)}
                  className={cn(
                    buttonVariants({
                      variant:
                        tab == link.title.toLowerCase() ? "default" : "ghost",
                      size: "icon",
                    }),
                    "h-9 w-9",
                    link.variant === "default" &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title.charAt(0).toUpperCase() + link.title.slice(1)}
                {link.label !== 0 && (
                  <div>
                    <span className="ml-auto text-muted-foreground">
                      {link.label}
                    </span>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span
              key={index}
              onClick={() => setTab(link.title)}
              className={cn(
                buttonVariants({
                  variant:
                    tab == link.title.toLowerCase() ? "default" : "ghost",
                  size: "sm",
                }),
                link.variant === "default" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start",
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title.charAt(0).toUpperCase() + link.title.slice(1)}
              {link.label !== 0n && (
                <div className="ml-auto">
                  <span className="ml-auto dark:text-white">{link.label}</span>
                </div>
              )}
            </span>
          ),
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
