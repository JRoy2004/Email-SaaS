import { ArchiveX, File, Inbox, Send, Trash2 } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface linkOptions {
  title: "inbox" | "drafts" | "sent" | "junk" | "trash";
  label?: bigint;
  icon: LucideIcon;
  variant: "default" | "ghost";
}

export const links: linkOptions[] = [
  {
    title: "inbox",
    icon: Inbox,
    variant: "default",
  },
  {
    title: "drafts",
    icon: File,
    variant: "ghost",
  },
  {
    title: "sent",
    icon: Send,
    variant: "ghost",
  },
  {
    title: "junk",
    icon: ArchiveX,
    variant: "ghost",
  },
  {
    title: "trash",
    icon: Trash2,
    variant: "ghost",
  },
];
