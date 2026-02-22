"use client";

import { useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Pencil,
  Trash,
  Eye,
  Check,
  X,
} from "lucide-react";
import type { BaseOperationConfig, DisplayMode, ModalType } from "../types";

/**
 * Width classes for sheet/dialog sizing
 */
const WIDTH_CLASSES = {
  sm: "sm:!max-w-sm", // ~384px
  md: "sm:!max-w-xl", // ~576px
  lg: "sm:!max-w-4xl", // ~896px
  xl: "sm:!max-w-6xl", // ~1152px
  full: "!w-screen !max-w-none",
} as const;

type WidthSize = keyof typeof WIDTH_CLASSES;

interface OperationModalProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modalType: ModalType;
  title: string;
  operation?: BaseOperationConfig<TData>;
  rowData: TData | null;
  onExecute: (data?: TData) => void;
  isLoading?: boolean;
  displayMode?: DisplayMode;
  width?: WidthSize;
}

const DEFAULT_DISPLAY_MODE: DisplayMode = "sheet";
const DEFAULT_WIDTH: WidthSize = "md";

export function OperationModal<TData>({
  open,
  onOpenChange,
  modalType,
  title,
  operation,
  rowData,
  onExecute,
  isLoading = false,
  displayMode = DEFAULT_DISPLAY_MODE,
  width,
}: OperationModalProps<TData>): React.ReactElement | null {
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  if (!open || !modalType || !operation) return null;

  const resolvedMode = displayMode ?? DEFAULT_DISPLAY_MODE;
  const resolvedWidth = width ?? operation.width ?? DEFAULT_WIDTH;
  const widthClass = WIDTH_CLASSES[resolvedWidth];
  const isSheetMode = resolvedMode === "sheet";
  const OperationComponent = operation.component;
  const hasComponent = Boolean(OperationComponent);
  const hasApi = Boolean(operation.api);
  const needsConfirmation = Boolean(operation.confirmation);
  const titleText = operation.modalTitle ?? getOperationTitle(modalType, title);
  const descriptionText =
    operation.modalDescription ?? getOperationDescription(modalType, title);

  const icon = operation.icon ?? getDefaultIcon(modalType);
  const confirmationMessage =
    operation.confirmation?.message ||
    descriptionText ||
    "Confirm this action.";

  const renderDialog = (children: ReactNode) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl ${widthClass}`}>
        {children}
      </DialogContent>
    </Dialog>
  );

  const renderSheet = (children: ReactNode) => (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={`w-full! ${widthClass} overflow-y-auto`}
      >
        {children}
      </SheetContent>
    </Sheet>
  );

  const showDescription =
    !operation.confirmation?.message && Boolean(descriptionText);

  const dialogHeader = (
    <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <DialogTitle className="text-lg font-bold">{titleText}</DialogTitle>
        {showDescription && (
          <DialogDescription>{descriptionText}</DialogDescription>
        )}
      </div>
    </DialogHeader>
  );

  const sheetHeader = (
    <SheetHeader className="flex flex-row items-center gap-4 space-y-0 text-left border-b pb-6 mb-6">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <SheetTitle className="text-2xl font-bold">{titleText}</SheetTitle>
        {showDescription && (
          <SheetDescription>{descriptionText}</SheetDescription>
        )}
      </div>
    </SheetHeader>
  );

  const confirmationBody = (confirmText: string, cancelText: string) => (
    <>
      {isSheetMode ? sheetHeader : dialogHeader}
      <div className="px-4 py-6 text-sm text-muted-foreground">
        <p>{confirmationMessage}</p>
      </div>
      {isSheetMode ? (
        <SheetFooter className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => onExecute(rowData ?? undefined)}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </SheetFooter>
      ) : (
        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="secondary">
                {cancelText}
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            onClick={() => onExecute(rowData ?? undefined)}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      )}
    </>
  );

  if (hasComponent && OperationComponent) {
    const componentContent = (
      <>
        {isSheetMode ? sheetHeader : dialogHeader}
        <div className="p-4">
          <OperationComponent
            data={modalType === "add" ? undefined : (rowData ?? undefined)}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </div>
      </>
    );

    return isSheetMode
      ? renderSheet(componentContent)
      : renderDialog(componentContent);
  }

  if (hasApi && needsConfirmation && operation.confirmation) {
    const { confirmation } = operation;
    return isSheetMode
      ? renderSheet(
          confirmationBody(
            confirmation.confirmText ?? "Confirm",
            confirmation.cancelText ?? "Cancel",
          ),
        )
      : renderDialog(
          confirmationBody(
            confirmation.confirmText ?? "Confirm",
            confirmation.cancelText ?? "Cancel",
          ),
        );
  }

  return null;
}

function getOperationTitle(type: ModalType, entityTitle: string): string {
  switch (type) {
    case "add":
      return `Add ${entityTitle}`;
    case "edit":
      return `Edit ${entityTitle}`;
    case "view":
      return `View ${entityTitle}`;
    case "delete":
      return `Delete ${entityTitle}`;
    case "complete":
      return `Complete ${entityTitle}`;
    case "dismiss":
      return `Dismiss ${entityTitle}`;
    default:
      return entityTitle;
  }
}

function getOperationDescription(type: ModalType, entityTitle: string): string {
  switch (type) {
    case "add":
      return `Fill in the details to add a new ${entityTitle.toLowerCase()}.`;
    case "edit":
      return `Make changes to this ${entityTitle.toLowerCase()}.`;
    case "view":
      return `View details of this ${entityTitle.toLowerCase()}.`;
    case "delete":
      return `Are you sure you want to delete this ${entityTitle.toLowerCase()}?`;
    case "complete":
      return `Mark this ${entityTitle.toLowerCase()} as complete.`;
    case "dismiss":
      return `Dismiss this ${entityTitle.toLowerCase()}.`;
    default:
      return "";
  }
}

function getDefaultIcon(type: ModalType): ReactNode | undefined {
  const props = { className: "h-5 w-5" };
  switch (type) {
    case "add":
      return <Plus {...props} />;
    case "edit":
      return <Pencil {...props} />;
    case "view":
      return <Eye {...props} />;
    case "delete":
      return <Trash {...props} />;
    case "complete":
      return <Check {...props} />;
    case "dismiss":
      return <X {...props} />;
    default:
      return undefined;
  }
}
