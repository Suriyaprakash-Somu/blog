"use client";

import { useCallback, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import type { ModalType } from "../types";

/**
 * Row data with required id field
 */
interface RowWithId {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Modal state
 */
interface ModalState<TData> {
  open: boolean;
  type: ModalType;
  data: TData | null;
}

/**
 * Return type for useTableUrlState
 */
interface UseTableUrlStateReturn<TData> {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  modalType: ModalType;
  rowData: TData | null;
  openAdd: () => void;
  openEdit: (data: TData) => void;
  openView: (data: TData) => void;
  openComplete: (data: TData) => void;
  openDismiss: (data: TData) => void;
  openDelete: (data: TData) => void;
  setModalType: (type: ModalType) => void;
  setRowData: (data: TData | null) => void;
}

/**
 * Hook for URL-synced modal state for DataTable
 * URL format: ?action=add|edit|view|complete|dismiss|delete&id=<rowId>
 */
export function useTableUrlState<TData extends RowWithId>(
  rows: TData[]
): UseTableUrlStateReturn<TData> {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [isClosing, setIsClosing] = useState(false);
  const [closingAction, setClosingAction] = useState<{
    type: string | null;
    id: string | null;
  } | null>(null);

  const [modalState, setModalState] = useState<ModalState<TData>>({
    open: false,
    type: null,
    data: null,
  });

  const action = searchParams.get("action");
  const id = searchParams.get("id");

  const resolveRowData = useCallback(
    (
      actionType: string | null,
      rowId: string | null,
      currentRows: TData[]
    ): TData | null => {
      if (!rowId || actionType === "add") return null;
      return (
        currentRows.find((row) => String(row.id) === String(rowId)) ?? null
      );
    },
    []
  );

  // Track previous URL params for sync
  const [prevUrlParams, setPrevUrlParams] = useState<{
    action: string | null;
    id: string | null;
    rows: TData[];
  }>({ action: null, id: null, rows });

  // Sync state from URL during render
  if (
    action !== prevUrlParams.action ||
    id !== prevUrlParams.id ||
    rows !== prevUrlParams.rows
  ) {
    setPrevUrlParams({ action, id, rows });

    let effectivelyClosing = isClosing;
    if (isClosing && closingAction) {
      const isSameAction =
        closingAction.type === action &&
        String(closingAction.id ?? "") === String(id ?? "");
      if (!action || !isSameAction) {
        effectivelyClosing = false;
        setIsClosing(false);
        setClosingAction(null);
      }
    }

    if (!effectivelyClosing) {
      if (!action) {
        if (modalState.open || modalState.type || modalState.data) {
          setModalState({ open: false, type: null, data: null });
        }
      } else {
        const data = resolveRowData(action, id, rows);
        const currentDataId = modalState.data?.id ?? null;
        const newDataId = data?.id ?? null;

        const isSameState =
          modalState.open === true &&
          modalState.type === action &&
          String(currentDataId) === String(newDataId);

        if (!isSameState) {
          setModalState({
            open: true,
            type: action as ModalType,
            data,
          });
        }
      }
    }
  }

  const buildUrl = useCallback(
    (newAction: string | null, newId?: string | number): string => {
      const params = new URLSearchParams(searchParams.toString());

      if (newAction) {
        params.set("action", newAction);
        if (newId !== undefined) {
          params.set("id", String(newId));
        } else {
          params.delete("id");
        }
      } else {
        params.delete("action");
        params.delete("id");
      }

      const queryString = params.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [searchParams, pathname]
  );

  const setModalOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        if (isClosing) return;
        setIsClosing(true);
        setClosingAction({
          type: modalState.type,
          id: modalState.data?.id?.toString() ?? searchParams.get("id"),
        });
        setModalState({ open: false, type: null, data: null });
        router.replace(buildUrl(null), { scroll: false });
      }
    },
    [router, buildUrl, modalState, searchParams, isClosing]
  );

  const openAdd = useCallback(() => {
    setModalState({ open: true, type: "add", data: null });
    router.push(buildUrl("add"), { scroll: false });
  }, [router, buildUrl]);

  const openEdit = useCallback(
    (data: TData) => {
      setModalState({ open: true, type: "edit", data });
      if (data.id !== undefined) {
        router.push(buildUrl("edit", data.id), { scroll: false });
      }
    },
    [router, buildUrl]
  );

  const openView = useCallback(
    (data: TData) => {
      setModalState({ open: true, type: "view", data });
      if (data.id !== undefined) {
        router.push(buildUrl("view", data.id), { scroll: false });
      }
    },
    [router, buildUrl]
  );

  const openComplete = useCallback(
    (data: TData) => {
      setModalState({ open: true, type: "complete", data });
      if (data.id !== undefined) {
        router.push(buildUrl("complete", data.id), { scroll: false });
      }
    },
    [router, buildUrl]
  );

  const openDismiss = useCallback(
    (data: TData) => {
      setModalState({ open: true, type: "dismiss", data });
      if (data.id !== undefined) {
        router.push(buildUrl("dismiss", data.id), { scroll: false });
      }
    },
    [router, buildUrl]
  );

  const openDelete = useCallback(
    (data: TData) => {
      setModalState({ open: true, type: "delete", data });
      if (data.id !== undefined) {
        router.push(buildUrl("delete", data.id), { scroll: false });
      }
    },
    [router, buildUrl]
  );

  const setModalType = useCallback(
    (type: ModalType) => {
      setModalState((prev) => ({ ...prev, type }));
    },
    []
  );

  const setRowData = useCallback(
    (data: TData | null) => {
      setModalState((prev) => ({ ...prev, data }));
    },
    []
  );

  return {
    modalOpen: modalState.open,
    setModalOpen,
    modalType: modalState.type,
    rowData: modalState.data,
    setModalType,
    setRowData,
    openAdd,
    openEdit,
    openView,
    openComplete,
    openDismiss,
    openDelete,
  };
}
