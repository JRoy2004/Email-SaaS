import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EmailEditor from "./email-editor/email-editor";

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
          handleSend={() => {
            console.log("Sending");
          }}
          isSending={false}
          defaultToolbarExpanded={true}
        />
      </SheetContent>
    </Sheet>
  );
};

export default ComposeEmailButton;
