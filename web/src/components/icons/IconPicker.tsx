"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DynamicIcon } from "./DynamicIcon";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// Pre-filter to only get valid React components that are icons from Lucide
const iconNames = Object.keys(LucideIcons).filter((key) => {
    if (key === "createLucideIcon" || key === "default" || key === "Icon") return false;
    // Icons typically start with a capital letter
    if (!/^[A-Z]/.test(key)) return false;

    // Ensure it's a valid React component
    const item = (LucideIcons as any)[key];
    return item && (typeof item === "function" || (typeof item === "object" && "$$typeof" in item));
});

interface IconPickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [parentRef, setParentRef] = React.useState<HTMLDivElement | null>(null);

    // Filter all icons based on search query
    const displayIcons = useMemo(() => {
        if (!searchQuery) return iconNames;
        return iconNames.filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const rowVirtualizer = useVirtualizer({
        count: displayIcons.length,
        getScrollElement: () => parentRef,
        estimateSize: () => 36,
        overscan: 10,
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between", className)}
                    >
                        {value ? (
                            <div className="flex items-center gap-2">
                                <DynamicIcon name={value} size={16} />
                                {value}
                            </div>
                        ) : (
                            "Select icon..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                }
            />
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search icon..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList ref={setParentRef}>
                        {displayIcons.length === 0 && (
                            <div className="py-6 text-center text-sm">No icon found.</div>
                        )}
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const iconName = displayIcons[virtualRow.index];
                                return (
                                    <CommandItem
                                        key={iconName}
                                        value={iconName}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        onSelect={(currentValue) => {
                                            // CommandItem lowercases the value, we need to find the correct casing
                                            const realName = iconNames.find(
                                                (n) => n.toLowerCase() === currentValue.toLowerCase()
                                            );
                                            if (realName) {
                                                onChange(realName);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <DynamicIcon name={iconName as string} size={16} />
                                            {iconName}
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                value === iconName ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </div>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover >
    );
}
