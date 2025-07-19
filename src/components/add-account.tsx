import React from "react";
import LinkAccountButton from "./link-account-button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";

import { Plus } from "lucide-react";
import { SiGmail } from "react-icons/si";
import { BiMailSend } from "react-icons/bi";
const AddAccount = () => {
  return (
    <div>
      <Menubar className="w-full">
        <MenubarMenu>
          <MenubarTrigger className="w-full">
            <Plus className="h-5" /> Add New Account
          </MenubarTrigger>
          <MenubarContent className="w-full">
            <MenubarItem className="w-full">
              <LinkAccountButton accountType="Google">
                <Plus /> <SiGmail /> Google
              </LinkAccountButton>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem className="w-full">
              <LinkAccountButton accountType="Office365">
                <Plus /> <BiMailSend /> Outlook
              </LinkAccountButton>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};

export default AddAccount;
