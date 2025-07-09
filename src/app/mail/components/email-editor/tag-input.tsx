import React, { useState } from "react";
import type { MultiValueProps, GroupBase } from "react-select";
import { api } from "@/trpc/react";
import Select from "react-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocalStorage } from "usehooks-ts";
import { accountDetails } from "../../atoms";
import { useAtomValue } from "jotai";

type OptionType = {
  label: string;
  value: string;
  data: { name: string; address: string };
};

type Props = {
  placeholder: string;
  label: string;
  onChange: (values: { label: string; value: string }[]) => void;
  values: { label: string; value: string }[];
};

const TagInput = ({ placeholder, label, onChange, values }: Props) => {
  const [accountId] = useLocalStorage("accountId", "");

  const accountInfo = useAtomValue(accountDetails);
  const accountEmail = accountInfo?.emailAddress;

  const { data: suggestions } = api.account.getSuggestions.useQuery({
    accountId,
  });
  const [inputValue, setInputValue] = useState<string>("");

  const options =
    suggestions?.emailAddresses
      .filter((s) => s.address !== accountEmail)
      .map((s) => ({
        label: s.name ?? s.address,
        value: s.address,
        data: {
          name: s.name ?? s.address,
          address: s.address,
        },
      })) ?? [];

  const selectedValues = values.map((v) => ({
    label: v.label,
    value: v.value,
    data: {
      name: v.label,
      address: v.value,
    },
  }));

  const formatOptionLabel = (option: {
    label: string;
    value: string;
    data: { name: string; address: string };
  }) => {
    const name = option.data?.name ?? option.label;
    const address = option.data?.address ?? option.value;

    return (
      <span className="flex items-center gap-2 rounded-full bg-white py-1 pl-2 shadow-sm transition-shadow duration-200 dark:bg-gray-900">
        <Avatar className="h-10 w-10 ring-2 ring-gray-300 dark:ring-gray-700">
          <AvatarImage alt="avatar" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
            {name
              .split(" ")
              .map((chunk) => chunk[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {name}
          </span>
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            {address}
          </span>
        </div>
      </span>
    );
  };

  const CustomMultiValue = (
    props: MultiValueProps<OptionType, true, GroupBase<OptionType>>,
  ) => {
    return (
      <div className="flex items-center gap-2 rounded-full border border-blue-500 bg-white pr-2 shadow-sm dark:bg-gray-900">
        {props.children}

        {/* Remove icon */}
        <span
          className="ml-2 cursor-pointer text-xl text-gray-400 hover:text-red-500"
          title="Remove"
          onClick={props.removeProps.onClick}
        >
          ×
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center rounded-md border p-2">
      <span className="mr-2 text-sm text-gray-500">{label}</span>
      <Select<OptionType, true, GroupBase<OptionType>>
        className="w-full text-sm"
        onInputChange={setInputValue}
        value={selectedValues}
        // @ts-expect-error Function Type Error Ignore
        onChange={onChange}
        options={
          inputValue
            ? options.concat({
                label: inputValue,
                value: inputValue,
                data: { name: inputValue, address: inputValue },
              })
            : options
        }
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder}
        isMulti
        components={{
          MultiValue: CustomMultiValue,
        }}
        classNames={{
          control: () =>
            "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:bg-transparent text-sm",
          multiValue: () => "dark:!bg-gray-700",
          multiValueLabel: () => "dark:text-white dark:bg-gray-700 rounded-md",
        }}
      />
    </div>
  );
};

export default TagInput;
