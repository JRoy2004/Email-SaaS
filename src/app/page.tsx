import LinkAccountButton from "@/components/link-account-button";
import GetNewEmails from "@/components/GetNewEmails";
export default function Home() {
  return (
    <div>
      <LinkAccountButton accountType="Google"> Add Acc</LinkAccountButton>
      <GetNewEmails />
    </div>
  );
}
