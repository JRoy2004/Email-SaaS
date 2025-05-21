"use client";
import React from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAtom } from "jotai";
import { searchingAtom, searchValueAtom } from "../atoms";

const SearchBar = () => {
  const [searchValue, setSearchValue] = useAtom(searchValueAtom);
  const [isSearching, setIsSearching] = useAtom(searchingAtom);

  const handleBlur = () => {
    if (searchValue !== "") return;
    setIsSearching(false);
  };

  return (
    <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search"
          className="pl-8"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (searchValue) setIsSearching(true);
          }}
          onFocus={() => {
            if (searchValue) setIsSearching(true);
          }}
          onBlur={handleBlur}
        />
        <div className="absolute right-2 top-2.5 flex items-center gap-2">
          {isSearching && (
            <Loader2 className="size-4 animate-spin text-gray-400" />
          )}
          {searchValue && (
            <button
              className="rounded-sm hover:bg-gray-400/20"
              onClick={() => {
                setSearchValue("");
                setIsSearching(false);
              }}
            >
              <X className="text=gray-400 size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
