"use client";
import React from "react";
import EmailEditor from "./email-editor/email-editor";
import { useAtomValue } from "jotai";
import { threadIdAtom } from "../atoms";
import { useLocalStorage } from "usehooks-ts";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";

const ReplyBox = () => {
  const threadId = useAtomValue(threadIdAtom);
  const [accountId] = useLocalStorage("accountId", "");
  const { data: replyDetails } = api.account.getReplyDetails.useQuery({
    accountId: accountId,
    threadId: threadId ?? "",
    replyType: "reply",
  });
  if (!replyDetails) return <></>;
  return (
    <Component
      replyDetails={replyDetails}
      accountId={accountId}
      threadId={threadId ?? ""}
    />
  );
};

const Component = ({
  replyDetails,
  threadId,
  accountId,
}: {
  replyDetails: NonNullable<RouterOutputs["account"]["getReplyDetails"]>;
  accountId: string;
  threadId: string;
}) => {
  const [subject, setSubject] = React.useState(
    replyDetails.subject.startsWith("Re:")
      ? replyDetails.subject
      : `Re: ${replyDetails.subject}`,
  );

  const [toValues, setToValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.to.map((to) => ({
      label: to.name ?? to.address,
      value: to.address,
    })) || [],
  );
  const [ccValues, setCcValues] = React.useState<
    { label: string; value: string }[]
  >(
    replyDetails.cc.map((cc) => ({
      label: cc.name ?? cc.address,
      value: cc.address,
    })) || [],
  );

  // const sendEmail = api.mail.sendEmail.useMutation();
  React.useEffect(() => {
    if (!replyDetails || !threadId) return;

    if (!replyDetails.subject.startsWith("Re:")) {
      setSubject(`Re: ${replyDetails.subject}`);
    }
    setToValues(
      replyDetails.to.map((to) => ({
        label: to.name ?? to.address,
        value: to.address,
      })),
    );
    setCcValues(
      replyDetails.cc.map((cc) => ({
        label: cc.name ?? cc.address,
        value: cc.address,
      })),
    );
  }, [replyDetails, threadId]);

  const sendEmail = api.account.sendEmail.useMutation();

  const handleSend = async (value: string) => {
    if (!replyDetails) return;
    sendEmail.mutate(
      {
        accountId: accountId ?? "",
        threadId: threadId ?? undefined,
        body: value,
        subject,
        from: replyDetails.from,
        to: replyDetails.to.map((to) => ({
          name: to.name ?? to.address,
          address: to.address,
        })),
        cc: replyDetails.cc.map((cc) => ({
          name: cc.name ?? cc.address,
          address: cc.address,
        })),
        replyTo: replyDetails.from,
        inReplyTo: replyDetails.id,
      },
      {
        onSuccess: () => {
          toast.success("Email sent");
        },
        onError: () => {
          toast.error("Error");
        },
      },
    );
  };

  return (
    <EmailEditor
      toValues={toValues}
      ccValues={ccValues}
      setToValues={(values) => {
        setToValues(values);
        console.log(values);
      }}
      setCcValues={(values) => {
        setCcValues(values);
      }}
      subject={subject}
      setSubject={setSubject}
      to={toValues.map((to) => to.label)}
      handleSend={handleSend}
      isSending={sendEmail.isPending}
    />
  );
};

export default ReplyBox;
