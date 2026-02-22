"use client";
"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import {
  CheckIcon,
  ChevronDown,
  XCircle,
  XIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export interface MultiSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: LucideIcon;
  style?: {
    badgeColor?: string;
    gradient?: string;
    iconColor?: string;
  };
  [key: string]: unknown;
}

export interface MultiSelectGroup {
  heading: string;
  options: MultiSelectOption[];
}

type MultiSelectValue = Array<MultiSelectOption["value"]>;

type ResponsivePreset = {
  maxCount?: number;
  hideIcons?: boolean;
  compactMode?: boolean;
};

type ResponsiveConfig =
  | boolean
  | {
      mobile?: ResponsivePreset;
      tablet?: ResponsivePreset;
      desktop?: ResponsivePreset;
    };

export interface MultiSelectHandle {
  reset: () => void;
  getSelectedValues: () => MultiSelectValue;
  setSelectedValues: (values: MultiSelectValue) => void;
  clear: () => void;
  focus: () => void;
}

export interface MultiSelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "defaultValue"
> {
  options: MultiSelectOption[] | MultiSelectGroup[];
  onValueChange: (value: MultiSelectValue) => void;
  variant?: "default" | "secondary" | "destructive" | "inverted";
  defaultValue?: MultiSelectValue;
  placeholder?: string;
  maxCount?: number;
  modalPopover?: boolean;
  className?: string;
  hideSelectAll?: boolean;
  searchable?: boolean;
  emptyIndicator?: string;
  autoSize?: boolean;
  singleLine?: boolean;
  popoverClassName?: string;
  disabled?: boolean;
  responsive?: ResponsiveConfig;
  minWidth?: string;
  maxWidth?: string;
  deduplicateOptions?: boolean;
  resetOnDefaultValueChange?: boolean;
  closeOnSelect?: boolean;
}

const multiSelectVariants = cva("m-1", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary:
        "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const MultiSelect = React.forwardRef<
  MultiSelectHandle,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      maxCount = 3,
      modalPopover = false,
      className,
      hideSelectAll = false,
      searchable = true,
      emptyIndicator,
      autoSize = false,
      singleLine = false,
      popoverClassName,
      disabled = false,
      responsive,
      minWidth,
      maxWidth,
      deduplicateOptions = false,
      resetOnDefaultValueChange = true,
      closeOnSelect = false,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] =
      React.useState<MultiSelectValue>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const [politeMessage, setPoliteMessage] = React.useState("");
    const [assertiveMessage, setAssertiveMessage] = React.useState("");
    const prevSelectedCount = React.useRef(selectedValues.length);
    const prevIsOpen = React.useRef(isPopoverOpen);
    const prevSearchValue = React.useRef(searchValue);

    const announce = React.useCallback(
      (message: string, priority = "polite") => {
        if (priority === "assertive") {
          setAssertiveMessage(message);
          setTimeout(() => setAssertiveMessage(""), 100);
        } else {
          setPoliteMessage(message);
          setTimeout(() => setPoliteMessage(""), 100);
        }
      },
      [],
    );

    const multiSelectId = React.useId();
    const listboxId = `${multiSelectId}-listbox`;
    const triggerDescriptionId = `${multiSelectId}-description`;
    const selectedCountId = `${multiSelectId}-count`;

    const prevDefaultValueRef = React.useRef(defaultValue);

    const isGroupedOptions = React.useCallback(
      (
        opts: MultiSelectOption[] | MultiSelectGroup[],
      ): opts is MultiSelectGroup[] => {
        const first = opts[0];
        if (!first) return false;
        return "heading" in first;
      },
      [],
    );

    const arraysEqual = React.useCallback(
      (a: MultiSelectValue, b: MultiSelectValue) => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].map(String).sort();
        const sortedB = [...b].map(String).sort();
        return sortedA.every((val, index) => val === sortedB[index]);
      },
      [],
    );

    const resetToDefault = React.useCallback(() => {
      setSelectedValues(defaultValue);
      setIsPopoverOpen(false);
      setSearchValue("");
      onValueChange(defaultValue);
    }, [defaultValue, onValueChange]);

    const buttonRef = React.useRef<HTMLButtonElement | null>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        reset: resetToDefault,
        getSelectedValues: () => selectedValues,
        setSelectedValues: (values: MultiSelectValue) => {
          setSelectedValues(values);
          onValueChange(values);
        },
        clear: () => {
          setSelectedValues([]);
          onValueChange([]);
        },
        focus: () => {
          if (buttonRef.current) {
            buttonRef.current.focus();
            const originalOutline = buttonRef.current.style.outline;
            const originalOutlineOffset = buttonRef.current.style.outlineOffset;
            buttonRef.current.style.outline = "2px solid hsl(var(--ring))";
            buttonRef.current.style.outlineOffset = "2px";
            setTimeout(() => {
              if (buttonRef.current) {
                buttonRef.current.style.outline = originalOutline;
                buttonRef.current.style.outlineOffset = originalOutlineOffset;
              }
            }, 1000);
          }
        },
      }),
      [resetToDefault, selectedValues, onValueChange],
    );

    const [screenSize, setScreenSize] = React.useState("desktop");

    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const mobileQuery = window.matchMedia("(max-width: 639px)");
      const tabletQuery = window.matchMedia(
        "(min-width: 640px) and (max-width: 1023px)",
      );

      const resolveScreenSize = () => {
        if (mobileQuery.matches) return "mobile";
        if (tabletQuery.matches) return "tablet";
        return "desktop";
      };

      const handleChange = () => {
        setScreenSize(resolveScreenSize());
      };

      handleChange();
      mobileQuery.addEventListener("change", handleChange);
      tabletQuery.addEventListener("change", handleChange);

      return () => {
        mobileQuery.removeEventListener("change", handleChange);
        tabletQuery.removeEventListener("change", handleChange);
      };
    }, []);

    const getResponsiveSettings = () => {
      if (!responsive) {
        return {
          maxCount,
          hideIcons: false,
          compactMode: false,
        };
      }

      if (responsive === true) {
        const defaultResponsive: Record<string, ResponsivePreset> = {
          mobile: { maxCount: 2, hideIcons: false, compactMode: true },
          tablet: { maxCount: 4, hideIcons: false, compactMode: false },
          desktop: { maxCount: 6, hideIcons: false, compactMode: false },
        };
        const currentSettings = defaultResponsive[screenSize] ?? {};
        return {
          maxCount: currentSettings.maxCount ?? maxCount,
          hideIcons: currentSettings.hideIcons ?? false,
          compactMode: currentSettings.compactMode ?? false,
        };
      }

      const responsiveConfig = responsive as Record<string, ResponsivePreset>;
      const currentSettings = responsiveConfig?.[screenSize] ?? {};
      return {
        maxCount: currentSettings.maxCount ?? maxCount,
        hideIcons: currentSettings.hideIcons ?? false,
        compactMode: currentSettings.compactMode ?? false,
      };
    };

    const responsiveSettings = getResponsiveSettings();

    const getAllOptions = React.useCallback(() => {
      if (options.length === 0) return [] as MultiSelectOption[];
      let allOptions: MultiSelectOption[] = [];
      if (isGroupedOptions(options)) {
        allOptions = options.flatMap((group) => group.options);
      } else {
        allOptions = options;
      }

      const valueSet = new Set<string>();
      const duplicates: Array<string | number> = [];
      const uniqueOptions: MultiSelectOption[] = [];

      allOptions.forEach((option) => {
        const valueKey = String(option.value);
        if (valueSet.has(valueKey)) {
          duplicates.push(option.value);
          if (!deduplicateOptions) {
            uniqueOptions.push(option);
          }
        } else {
          valueSet.add(valueKey);
          uniqueOptions.push(option);
        }
      });

      if (process.env.NODE_ENV === "development" && duplicates.length > 0) {
        const action = deduplicateOptions
          ? "automatically removed"
          : "detected";
        console.warn(
          `MultiSelect: Duplicate option values ${action}: ${duplicates.join(
            ", ",
          )}. ` +
            `${
              deduplicateOptions
                ? "Duplicates have been removed automatically."
                : "This may cause unexpected behavior. Consider setting 'deduplicateOptions={true}' or ensure all option values are unique."
            }`,
        );
      }

      return deduplicateOptions ? uniqueOptions : allOptions;
    }, [options, deduplicateOptions, isGroupedOptions]);

    const getOptionByValue = React.useCallback(
      (value: MultiSelectOption["value"]) => {
        const option = getAllOptions().find(
          (optionItem) => optionItem.value === value,
        );
        if (!option && process.env.NODE_ENV === "development") {
          console.warn(
            `MultiSelect: Option with value "${String(
              value,
            )}" not found in options list`,
          );
        }
        return option;
      },
      [getAllOptions],
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchValue) return options;
      if (options.length === 0) return [];
      if (isGroupedOptions(options)) {
        return options
          .map((group) => ({
            ...group,
            options: group.options.filter(
              (option) =>
                option.label
                  .toLowerCase()
                  .includes(searchValue.toLowerCase()) ||
                String(option.value)
                  .toLowerCase()
                  .includes(searchValue.toLowerCase()),
            ),
          }))
          .filter((group) => group.options.length > 0);
      }
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          String(option.value)
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
      );
    }, [options, searchValue, searchable, isGroupedOptions]);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const handleTriggerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
      event,
    ) => {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setIsPopoverOpen(true);
      }
    };

    const { ...restProps } = props;

    const toggleOption = (optionValue: MultiSelectOption["value"]) => {
      if (disabled) return;
      const option = getOptionByValue(optionValue);
      if (option?.disabled) return;
      const newSelectedValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((value) => value !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const handleClear = () => {
      if (disabled) return;
      setSelectedValues([]);
      onValueChange([]);
    };

    const clearExtraOptions = () => {
      if (disabled) return;
      const newSelectedValues = selectedValues.slice(
        0,
        responsiveSettings.maxCount,
      );
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (disabled) return;
      const baseOptions =
        filteredOptions.length > 0 ? filteredOptions : getAllOptions();
      const flatOptions = isGroupedOptions(baseOptions)
        ? baseOptions.flatMap((group) => group.options)
        : baseOptions;
      const selectableOptions = flatOptions.filter(
        (option) => !option.disabled,
      );
      const selectableValues = selectableOptions.map((option) => option.value);
      const selectedSet = new Set(selectedValues);
      const allFilteredSelected = selectableValues.every((value) =>
        selectedSet.has(value),
      );

      if (allFilteredSelected) {
        const remaining = selectedValues.filter(
          (value) => !selectableValues.includes(value),
        );
        setSelectedValues(remaining);
        onValueChange(remaining);
      } else {
        const merged = Array.from(
          new Set([...selectedValues, ...selectableValues]),
        );
        setSelectedValues(merged);
        onValueChange(merged);
      }

      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    React.useEffect(() => {
      if (!resetOnDefaultValueChange) return;
      const prevDefaultValue = prevDefaultValueRef.current;
      if (!arraysEqual(prevDefaultValue, defaultValue)) {
        if (!arraysEqual(selectedValues, defaultValue)) {
          setSelectedValues(defaultValue);
        }
        prevDefaultValueRef.current = [...defaultValue];
      }
    }, [defaultValue, selectedValues, arraysEqual, resetOnDefaultValueChange]);

    const getWidthConstraints = () => {
      const defaultMinWidth = screenSize === "mobile" ? "0px" : "auto";
      const effectiveMinWidth = minWidth || defaultMinWidth;
      const effectiveMaxWidth = maxWidth || "100%";
      return {
        minWidth: effectiveMinWidth,
        maxWidth: effectiveMaxWidth,
        width: autoSize ? "auto" : "100%",
      };
    };

    const widthConstraints = getWidthConstraints();

    React.useEffect(() => {
      if (!isPopoverOpen) {
        setSearchValue("");
      }
    }, [isPopoverOpen]);

    React.useEffect(() => {
      const selectedCount = selectedValues.length;
      const allOptions = getAllOptions();
      const totalOptions = allOptions.filter((opt) => !opt.disabled).length;
      if (selectedCount !== prevSelectedCount.current) {
        const diff = selectedCount - prevSelectedCount.current;
        if (diff > 0) {
          const addedItems = selectedValues.slice(-diff);
          const addedLabels = addedItems
            .map(
              (value) => allOptions.find((opt) => opt.value === value)?.label,
            )
            .filter(Boolean);

          if (addedLabels.length === 1) {
            announce(
              `${addedLabels[0]} selected. ${selectedCount} of ${totalOptions} options selected.`,
            );
          } else {
            announce(
              `${addedLabels.length} options selected. ${selectedCount} of ${totalOptions} total selected.`,
            );
          }
        } else if (diff < 0) {
          announce(
            `Option removed. ${selectedCount} of ${totalOptions} options selected.`,
          );
        }
        prevSelectedCount.current = selectedCount;
      }

      if (isPopoverOpen !== prevIsOpen.current) {
        if (isPopoverOpen) {
          announce(
            `Dropdown opened. ${totalOptions} options available. Use arrow keys to navigate.`,
          );
        } else {
          announce("Dropdown closed.");
        }
        prevIsOpen.current = isPopoverOpen;
      }

      if (
        searchValue !== prevSearchValue.current &&
        searchValue !== undefined
      ) {
        if (searchValue && isPopoverOpen) {
          const filteredCount = allOptions.filter(
            (opt) =>
              opt.label.toLowerCase().includes(searchValue.toLowerCase()) ||
              String(opt.value)
                .toLowerCase()
                .includes(searchValue.toLowerCase()),
          ).length;

          announce(
            `${filteredCount} option${filteredCount === 1 ? "" : "s"} found for "${searchValue}"`,
          );
        }
        prevSearchValue.current = searchValue;
      }
    }, [selectedValues, isPopoverOpen, searchValue, announce, getAllOptions]);

    return (
      <>
        <div className="sr-only">
          <output aria-live="polite" aria-atomic="true">
            {politeMessage}
          </output>
          <div aria-live="assertive" aria-atomic="true" role="alert">
            {assertiveMessage}
          </div>
        </div>

        <Popover
          open={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          modal={modalPopover}
        >
          <div id={triggerDescriptionId} className="sr-only">
            Multi-select dropdown. Use arrow keys to navigate, Enter to select,
            and Escape to close.
          </div>
          <div id={selectedCountId} className="sr-only" aria-live="polite">
            {selectedValues.length === 0
              ? "No options selected"
              : `${selectedValues.length} option${selectedValues.length === 1 ? "" : "s"} selected: ${selectedValues
                  .map((value) => getOptionByValue(value)?.label)
                  .filter(Boolean)
                  .join(", ")}`}
          </div>

          <PopoverTrigger
            disabled={disabled}
            nativeButton
            ref={buttonRef}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex p-1 rounded-md border border-input min-h-10 h-auto items-center justify-between bg-background hover:bg-accent hover:text-accent-foreground",
              autoSize ? "w-auto" : "w-full",
              responsiveSettings.compactMode && "min-h-8 text-sm",
              screenSize === "mobile" && "min-h-12 text-base",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            style={{
              ...widthConstraints,
              maxWidth: `min(${widthConstraints.maxWidth}, 100%)`,
            }}
            aria-expanded={isPopoverOpen}
            aria-haspopup="listbox"
            aria-controls={isPopoverOpen ? listboxId : undefined}
            aria-describedby={`${triggerDescriptionId} ${selectedCountId}`}
            aria-label={`Multi-select: ${selectedValues.length} of ${getAllOptions().length} options selected. ${placeholder}`}
            onKeyDown={
              handleTriggerKeyDown as unknown as React.KeyboardEventHandler<HTMLButtonElement>
            }
            onClick={(event) => {
              const target = event.target as HTMLElement | null;
              const actionEl = target?.closest(
                "[data-action]",
              ) as HTMLElement | null;
              if (!actionEl) return;
              event.preventDefault();
              event.stopPropagation();

              const action = actionEl.getAttribute("data-action");
              const valueAttr = actionEl.getAttribute("data-value");
              const matchedValue = getAllOptions().find(
                (option) => String(option.value) === valueAttr,
              )?.value;

              if (action === "remove" && matchedValue !== undefined) {
                toggleOption(matchedValue);
              }

              if (action === "clear-extra") {
                clearExtraOptions();
              }

              if (action === "clear-all") {
                handleClear();
              }
            }}
            {...(restProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            {selectedValues.length > 0 ? (
              <div className="flex justify-between items-center w-full pointer-events-none">
                <div
                  className={cn(
                    "flex items-center gap-1",
                    singleLine
                      ? "overflow-x-auto multiselect-singleline-scroll"
                      : "flex-wrap",
                    responsiveSettings.compactMode && "gap-0.5",
                  )}
                  style={singleLine ? { paddingBottom: "4px" } : {}}
                >
                  {selectedValues
                    .slice(0, responsiveSettings.maxCount)
                    .map((value) => {
                      const option = getOptionByValue(value);
                      const IconComponent = option?.icon;
                      const customStyle = option?.style;
                      if (!option) {
                        return null;
                      }
                      const badgeStyle = {
                        ...(customStyle?.badgeColor && {
                          backgroundColor: customStyle.badgeColor,
                        }),
                        ...(customStyle?.gradient && {
                          background: customStyle.gradient,
                          color: "white",
                        }),
                      };

                      return (
                        <Badge
                          key={String(value)}
                          className={cn(
                            multiSelectVariants({ variant }),
                            customStyle?.gradient &&
                              "text-white border-transparent",
                            responsiveSettings.compactMode &&
                              "text-xs px-1.5 py-0.5",
                            screenSize === "mobile" && "max-w-30 truncate",
                            singleLine && "flex-0 whitespace-nowrap",
                          )}
                          style={badgeStyle}
                        >
                          {IconComponent && !responsiveSettings.hideIcons && (
                            <IconComponent
                              className={cn(
                                "h-4 w-4 mr-2",
                                responsiveSettings.compactMode &&
                                  "h-3 w-3 mr-1",
                                customStyle?.iconColor && "text-current",
                              )}
                              {...(customStyle?.iconColor && {
                                style: { color: customStyle.iconColor },
                              })}
                            />
                          )}
                          <span
                            className={cn(
                              screenSize === "mobile" && "truncate",
                            )}
                          >
                            {option.label}
                          </span>
                          <span
                            data-action="remove"
                            data-value={String(value)}
                            className="ml-2 pl-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm p-0 cursor-pointer hover:bg-accent/20 focus:outline-none focus:ring-1 focus:ring-ring/50 pointer-events-auto"
                          >
                            <XCircle
                              className={cn(
                                "h-3 w-3 hover:text-destructive",
                                responsiveSettings.compactMode && "h-2.5 w-2.5",
                              )}
                            />
                          </span>
                        </Badge>
                      );
                    })
                    .filter(Boolean)}
                  {selectedValues.length > responsiveSettings.maxCount && (
                    <Badge
                      className={cn(
                        "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                        multiSelectVariants({ variant }),
                        responsiveSettings.compactMode &&
                          "text-xs px-1.5 py-0.5",
                        singleLine && "flex-0 whitespace-nowrap",
                      )}
                    >
                      {`+ ${selectedValues.length - responsiveSettings.maxCount} more`}
                      <span
                        data-action="clear-extra"
                        className="ml-2 inline-flex h-4 w-4 shrink-0 items-center justify-center cursor-pointer focus:outline-none pointer-events-auto"
                      >
                        <XCircle
                          className={cn(
                            "h-4 w-4 hover:text-destructive",
                            responsiveSettings.compactMode && "h-3 w-3",
                          )}
                        />
                      </span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pointer-events-auto">
                  <span
                    data-action="clear-all"
                    className="flex items-center justify-center h-4 w-4 mx-2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
                  >
                    <XIcon className="h-4 w-4" />
                  </span>
                  <Separator
                    orientation="vertical"
                    className="flex min-h-6 h-full"
                  />
                  <ChevronDown
                    className="h-4 mx-2 cursor-pointer text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto pointer-events-none">
                <span className="text-sm text-muted-foreground mx-3 flex-1 truncate">
                  {placeholder}
                </span>
                <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2 shrink-0" />
              </div>
            )}
          </PopoverTrigger>

          <PopoverContent
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Available options"
            className={cn(
              "w-auto p-0 border-0 shadow-lg",
              screenSize === "mobile" && "w-[85vw] max-w-70",
              screenSize === "tablet" && "w-[70vw] max-w-md",
              screenSize === "desktop" && "min-w-75",
              popoverClassName,
            )}
            style={{
              maxWidth: `min(${widthConstraints.maxWidth}, 85vw)`,
              touchAction: "manipulation",
            }}
            align="start"
          >
            <Command>
              {searchable && (
                <CommandInput
                  placeholder="Search options..."
                  onKeyDown={handleInputKeyDown}
                  onValueChange={setSearchValue}
                  aria-label="Search through available options"
                  aria-describedby={`${multiSelectId}-search-help`}
                />
              )}
              {searchable && (
                <div id={`${multiSelectId}-search-help`} className="sr-only">
                  Type to filter options. Use arrow keys to navigate results.
                </div>
              )}
              <CommandList
                className={cn(
                  "max-h-[40vh] overflow-y-auto",
                  "overscroll-behavior-y-contain",
                )}
              >
                <CommandEmpty>
                  {emptyIndicator || "No results found."}
                </CommandEmpty>
                {!hideSelectAll && !searchValue && (
                  <CommandGroup>
                    <CommandItem
                      key="all"
                      onSelect={toggleAll}
                      role="option"
                      aria-selected={
                        selectedValues.length ===
                        getAllOptions().filter((opt) => !opt.disabled).length
                      }
                      aria-label={`Select all ${getAllOptions().length} options`}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedValues.length ===
                            getAllOptions().filter((opt) => !opt.disabled)
                              .length
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 group-data-[selected=true]/command-item:bg-primary group-data-[selected=true]/command-item:text-primary-foreground",
                        )}
                        data-selected={
                          selectedValues.length ===
                          getAllOptions().filter((opt) => !opt.disabled).length
                        }
                        aria-hidden="true"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>
                        (Select All
                        {getAllOptions().length > 20
                          ? ` - ${getAllOptions().length} options`
                          : ""}
                        )
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {isGroupedOptions(filteredOptions) ? (
                  filteredOptions.map((group) => (
                    <CommandGroup key={group.heading} heading={group.heading}>
                      {group.options.map((option) => {
                        const isSelected = selectedValues.includes(
                          option.value,
                        );
                        return (
                          <CommandItem
                            key={String(option.value)}
                            onSelect={() => toggleOption(option.value)}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={option.disabled}
                            aria-label={`${option.label}${isSelected ? ", selected" : ", not selected"}${
                              option.disabled ? ", disabled" : ""
                            }`}
                            className={cn(
                              "cursor-pointer",
                              option.disabled &&
                                "opacity-50 cursor-not-allowed",
                            )}
                            disabled={option.disabled}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 group-data-[selected=true]/command-item:bg-primary group-data-[selected=true]/command-item:text-primary-foreground",
                              )}
                              data-selected={isSelected}
                              aria-hidden="true"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </div>
                            {option.icon && (
                              <option.icon
                                className="mr-2 h-4 w-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            )}
                            <span>{option.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))
                ) : (
                  <CommandGroup>
                    {filteredOptions.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <CommandItem
                          key={String(option.value)}
                          onSelect={() => toggleOption(option.value)}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled}
                          aria-label={`${option.label}${isSelected ? ", selected" : ", not selected"}${
                            option.disabled ? ", disabled" : ""
                          }`}
                          className={cn(
                            "cursor-pointer",
                            option.disabled && "opacity-50 cursor-not-allowed",
                          )}
                          disabled={option.disabled}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible",
                            )}
                            data-selected={isSelected}
                            aria-hidden="true"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          {option.icon && (
                            <option.icon
                              className="mr-2 h-4 w-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                <CommandSeparator />
                <CommandGroup>
                  <div className="flex items-center justify-between">
                    {selectedValues.length > 0 && (
                      <>
                        <CommandItem
                          onSelect={handleClear}
                          className="flex-1 justify-center cursor-pointer"
                        >
                          Clear
                        </CommandItem>
                        <Separator
                          orientation="vertical"
                          className="flex min-h-6 h-full"
                        />
                      </>
                    )}
                    <CommandItem
                      onSelect={() => setIsPopoverOpen(false)}
                      className="flex-1 justify-center cursor-pointer max-w-full"
                    >
                      Close
                    </CommandItem>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
