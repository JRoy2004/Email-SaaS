import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EmailEditor from "./email-editor/email-editor";
import { useAtomValue } from "jotai";
import { accountDetails } from "../atoms";
import { toast } from "sonner";

type Props = { isCollapsed: boolean };

const ComposeEmailButton = ({ isCollapsed }: Props) => {
  const side = "bottom";
  const [toValues, setToValues] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [ccValues, setCcValues] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [subject, setSubject] = useState<string>("");

  const accountD = useAtomValue(accountDetails);
  const sendEmail = api.account.sendEmail.useMutation();

  const handleSend = async (value: string) => {
    sendEmail.mutate(
      {
        accountId: accountD?.id ?? "",
        body: value,
        subject,
        from: {
          name: accountD?.name ?? "",
          address: accountD?.emailAddress ?? "",
        },
        to: toValues.map((to) => ({
          name: to.label ?? to.value,
          address: to.value,
        })),
        cc: ccValues.map((cc) => ({
          name: cc.label ?? cc.value,
          address: cc.value,
        })),
        replyTo: {
          name: accountD?.name ?? "",
          address: accountD?.emailAddress ?? "",
        },
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
    setSubject("");
    setToValues([]);
    setCcValues([]);
  };
  return (
    <Sheet key={side}>
      <SheetTrigger asChild>
        <Button>
          {isCollapsed ? (
            <Pencil size={20} strokeWidth={2} />
          ) : (
            <div className="flex gap-1">
              <Pencil size={20} strokeWidth={2} />
              Compose
            </div>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle className="pl-4">Compose Email</SheetTitle>
        </SheetHeader>
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
          defaultToolbarExpanded={true}
        />
      </SheetContent>
    </Sheet>
  );
};

export default ComposeEmailButton;
