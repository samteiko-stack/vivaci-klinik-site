"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { AlertVariant } from "./Feedback";

export const TOAST_DURATION_MS = 5000;

const TOAST_ICONS: Record<AlertVariant, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  success: CheckCircle,
  danger: AlertCircle,
  warning: AlertTriangle,
  info: InfoCircle,
};

type ToastItem = {
  id: string;
  message: string;
  variant: AlertVariant;
  duration: number;
};

type ToastOptions = {
  variant?: AlertVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setVisible(true));
    const hideTimer = window.setTimeout(() => setVisible(false), item.duration);
    const removeTimer = window.setTimeout(() => onDismissRef.current(), item.duration + 220);

    return () => {
      cancelAnimationFrame(enterFrame);
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [item.duration, item.id]);

  function dismissNow() {
    setVisible(false);
    window.setTimeout(() => onDismissRef.current(), 220);
  }

  const t = useTranslations("common");
  const Icon = TOAST_ICONS[item.variant];

  return (
    <div
      role="status"
      className={cn("ds-toast", `ds-toast--${item.variant}`, visible && "ds-toast--visible")}
    >
      <span className="ds-toast__icon" aria-hidden>
        <Icon className="ds-icon-sm" strokeWidth={2} />
      </span>
      <span className="ds-toast__message">{item.message}</span>
      <button
        type="button"
        className="ds-toast__close"
        onClick={dismissNow}
        aria-label={t("dismissNotification")}
      >
        <X className="ds-icon-2xs" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message: string, options?: ToastOptions) => {
    const id = String(++idRef.current);
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        variant: options?.variant ?? "info",
        duration: options?.duration ?? TOAST_DURATION_MS,
      },
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message, duration) => push(message, { variant: "success", duration }),
      error: (message, duration) => push(message, { variant: "danger", duration }),
      warning: (message, duration) => push(message, { variant: "warning", duration }),
      info: (message, duration) => push(message, { variant: "info", duration }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ds-toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
