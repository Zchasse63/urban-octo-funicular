"use client";

import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    success: (message: string, description?: string) =>
      sonnerToast.success(message, { description }),

    error: (message: string, description?: string) =>
      sonnerToast.error(message, { description }),

    info: (message: string, description?: string) =>
      sonnerToast.info(message, { description }),

    warning: (message: string, description?: string) =>
      sonnerToast.warning(message, { description }),

    loading: (message: string) =>
      sonnerToast.loading(message),

    dismiss: (toastId?: string | number) =>
      sonnerToast.dismiss(toastId),

    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string;
        error: string;
      }
    ) =>
      sonnerToast.promise(promise, { loading, success, error }),
  };
}
