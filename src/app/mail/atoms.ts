import { atom } from "jotai";
import { type Prisma } from "@prisma/client";

export type Thread = Prisma.ThreadGetPayload<{
  include: {
    emails: {
      orderBy: { sentAt: "asc" };
      select: {
        from: true;
        to: {
          select: {
            id: true;
            name: true;
            address: true;
          };
        };
        cc: {
          select: {
            id: true;
            name: true;
            address: true;
          };
        };
        body: true;
        bodySnippet: true;
        emailLabel: true;
        subject: true;
        sysLabels: true;
        sysClassifications: true;
        id: true;
        sentAt: true;
      };
    };
  };
}>;

type AccountDetails = {
  id: string;
  emailAddress: string;
  name: string;
};

export const accountDetails = atom<AccountDetails | null>(null);

export const threadIdAtom = atom<string | null>(null);

export const threadsListAtom = atom<Thread[] | null>(null);

export const threadAtom = atom((get) => {
  return get(threadsListAtom)?.find((item) => get(threadIdAtom) == item.id);
});

export const searchValueAtom = atom<string>("");
export const searchingAtom = atom<boolean>(false);
