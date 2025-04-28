"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import AccountSwitcher from "./components/account-switcher";
import Sidebar from "./components/sidebar";
import ThreadList from "./components/thread-list";
import MailDisplay from "./components/mail-display";
import ThemeToggle from "@/components/theme-toggle";
import useIsMobile from "./hooks/useIsMobile";
import { useAtomValue } from "jotai";
import { threadIdAtom } from "./atoms";
import ComposeEmailButton from "./components/compose-email-button";

type Props = {
  defaultLayout: number[] | undefined;
  navCollasedSize: number;
  defaultCollapsed: boolean;
};

const Mail = ({
  defaultLayout = [20, 32, 48],
  navCollasedSize = 50,
  defaultCollapsed = false,
}: Props) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeView, setActiveView] = useState<"list" | "mail">("list");

  const threadId = useAtomValue(threadIdAtom);

  useEffect(() => {
    if (threadId && isMobile) setActiveView("mail");
    else setActiveView("list");
    // if (isMobile) setIsCollapsed(true);
  }, [threadId, isMobile]);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          console.log("Layout changed:", sizes);
        }}
        className="h-full min-h-screen items-stretch"
      >
        {(!isMobile || activeView === "list") && (
          <>
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              collapsedSize={navCollasedSize}
              collapsible={true}
              minSize={15}
              maxSize={40}
              onCollapse={() => {
                setIsCollapsed(true);
              }}
              onResize={() => {
                setIsCollapsed(false);
              }}
              className={cn(
                isCollapsed &&
                  "h-screen min-w-[50px] transition-all duration-300 ease-in-out",
              )}
            >
              <div className="flex h-full flex-1 flex-col justify-start">
                <div
                  className={cn(
                    "flex items-center justify-between",
                    isCollapsed ? "flex-col" : "flex-col sm:flex-row",
                  )}
                >
                  <div className="p-5">logo</div>
                  <div className={cn(!isCollapsed && "mr-2")}>
                    <ThemeToggle />
                  </div>
                </div>
                <div
                  className={`flex h-[50px] items-center justify-between p-5 ${isCollapsed ? "h-[52px]" : "px-2"}`}
                >
                  {/* Account Switcher */}
                  <AccountSwitcher isCollapsed={isCollapsed} />
                </div>
                <div className="flex h-[85vh] flex-col justify-between">
                  <div className="jaga flex flex-col gap-4 p-2 pb-4">
                    <div>
                      {/* sidebar */}
                      <Sidebar isCollapsed={isCollapsed} />
                    </div>
                    <div className="mx-auto">
                      {/* Compose */}
                      <ComposeEmailButton isCollapsed={isCollapsed} />
                    </div>
                    <Separator />
                  </div>
                  <div className="">
                    {/**  AI */}
                    Ask AI
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
              <Tabs defaultValue="all">
                <div className="flex items-center px-4 py-2">
                  <h1 className="text-xl font-bold">Inbox</h1>
                  <TabsList className="ml-auto">
                    <TabsTrigger
                      value="all"
                      className="text-zinc-600 dark:text-zinc-200"
                    >
                      To Do
                    </TabsTrigger>

                    <TabsTrigger
                      value="done"
                      className="text-zinc-600 dark:text-zinc-200"
                    >
                      Done
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Separator />
                <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <form>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search" className="pl-8" />
                    </div>
                  </form>
                </div>
                <TabsContent value="all" className="m-0">
                  <ThreadList done={false} />
                </TabsContent>

                <TabsContent value="done" className="m-0">
                  <ThreadList done={true} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </>
        )}
        {(!isMobile || activeView === "mail") && (
          <>
            {/* only show handle on desktop */}
            {!isMobile && <ResizableHandle withHandle />}

            <ResizablePanel
              defaultSize={defaultLayout[2]}
              minSize={40}
              className="relative border"
            >
              <MailDisplay isMobile={isMobile} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;
