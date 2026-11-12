"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button, type DsVariant } from "./Button";
import { Flex } from "./Layout";
import { Text } from "./Text";

export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("ds-list", className)} {...props} />;
}

export function ListItem({
  clickable,
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement> & { clickable?: boolean }) {
  return (
    <li
      className={cn("ds-list-item", clickable && "ds-list-item--clickable", className)}
      {...props}
    />
  );
}

export type AlertVariant = "success" | "danger" | "warning" | "info";

export function Alert({
  variant = "info",
  compact,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant; compact?: boolean }) {
  return (
    <div
      role="alert"
      className={cn("ds-alert", `ds-alert--${variant}`, compact && "ds-alert--compact", className)}
      {...props}
    />
  );
}

export type FormMessageVariant = "danger" | "success" | "warning";

export function FormMessage({
  variant = "danger",
  onDismiss,
  className,
  children,
}: {
  variant?: FormMessageVariant;
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");

  return (
    <p
      role="alert"
      className={cn("ds-form-message", `ds-form-message--${variant}`, className)}
    >
      <span className="ds-form-message__text">{children}</span>
      {onDismiss && (
        <button
          type="button"
          className="ds-form-message__dismiss"
          onClick={onDismiss}
          aria-label={t("dismiss")}
        >
          <X className="ds-icon-2xs" />
        </button>
      )}
    </p>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "panel",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "compact" | "panel" | "page";
}) {
  return (
    <div
      className={cn(
        "ds-empty",
        size === "panel" && "ds-empty--panel",
        size === "page" && "ds-empty--page",
        className
      )}
    >
      {icon && <div className="ds-empty__icon">{icon}</div>}
      <p className="ds-empty__title">{title}</p>
      {description && <p className="ds-empty__desc">{description}</p>}
      {action && <div className="ds-empty__action">{action}</div>}
    </div>
  );
}

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("common");

  return (
    <div
      className={cn("ds-spinner", size === "sm" && "ds-spinner--sm", className)}
      role="status"
      aria-label={t("loading")}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-skeleton", className)} {...props} />;
}

export type ModalSize = "default" | "narrow" | "wide" | "lg" | "xl" | "confirm";

let modalLayerOpenCount = 0;
let bodyScrollLockCount = 0;
let bodyScrollLockPrevOverflow = "";

function useModalLayer(open: boolean): number {
  const [layer, setLayer] = useState(0);

  useEffect(() => {
    if (!open) {
      setLayer(0);
      return;
    }
    modalLayerOpenCount += 1;
    const assignedLayer = modalLayerOpenCount;
    setLayer(assignedLayer);
    return () => {
      modalLayerOpenCount = Math.max(0, modalLayerOpenCount - 1);
    };
  }, [open]);

  return layer;
}

function useBodyScrollLock(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    bodyScrollLockCount += 1;
    if (bodyScrollLockCount === 1) {
      bodyScrollLockPrevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
      if (bodyScrollLockCount === 0) {
        document.body.style.overflow = bodyScrollLockPrevOverflow;
      }
    };
  }, [open]);
}

export function ModalFooterActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ds-modal-footer-actions", className)}>{children}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  bodyClassName,
  size = "default",
  closeOnBackdrop = true,
  hideClose = false,
  shellRef,
  measureRef,
  shellStyle,
  heightAnimate = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
  shellRef?: React.Ref<HTMLDivElement>;
  measureRef?: React.Ref<HTMLDivElement>;
  shellStyle?: React.CSSProperties;
  heightAnimate?: boolean;
}) {
  const t = useTranslations("common");
  const layer = useModalLayer(open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const backdropZIndex =
    layer > 1
      ? `calc(var(--z-modal-backdrop) + (var(--z-modal-layer-step) * ${layer - 1}))`
      : undefined;

  const sizeClass =
    size === "narrow"
      ? "ds-modal--narrow"
      : size === "wide"
        ? "ds-modal--wide"
        : size === "lg"
          ? "ds-modal--lg"
          : size === "xl"
            ? "ds-modal--xl"
            : size === "confirm"
              ? "ds-modal--confirm"
              : undefined;

  const modalSections = (
    <>
      <div className="ds-modal-header">
        <div className="ds-modal-header__text">
          {title ? (
            <h2 id="ds-modal-title" className="ds-modal-title">
              {title}
            </h2>
          ) : null}
          {subtitle ? <div className="ds-modal-subtitle">{subtitle}</div> : null}
        </div>
        {!hideClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ds-modal-close"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="ds-icon-sm" aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className={cn("ds-modal-body", bodyClassName)}>{children}</div>
      {footer ? <div className="ds-modal-footer">{footer}</div> : null}
    </>
  );

  const dialog = (
    <div
      className={cn("ds-modal-backdrop", layer > 1 && "ds-modal-backdrop--stacked")}
      style={backdropZIndex ? { zIndex: backdropZIndex } : undefined}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={shellRef}
        style={shellStyle}
        className={cn(
          "ds-modal",
          sizeClass,
          className,
          measureRef && "ds-modal--height-driven",
          heightAnimate && "ds-modal--height-animate"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "ds-modal-title" : undefined}
      >
        {measureRef ? (
          <div ref={measureRef} className="ds-modal-height-content">
            {modalSections}
          </div>
        ) : (
          modalSections
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(dialog, document.body) : null;
}

export type ConfirmModalIconTone = "danger" | "amber" | "neutral";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "danger",
  loading = false,
  icon: Icon,
  iconTone = "danger",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: DsVariant;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconTone?: ConfirmModalIconTone;
  children?: React.ReactNode;
}) {
  const t = useTranslations("common");
  const resolvedConfirmLabel = confirmLabel ?? t("confirm");
  const resolvedCancelLabel = cancelLabel ?? t("cancel");
  const iconClassName =
    iconTone === "amber"
      ? "ds-modal-confirm-icon--amber"
      : iconTone === "neutral"
        ? "ds-modal-confirm-icon--neutral"
        : "ds-modal-confirm-icon--danger";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="confirm"
      footer={
        <ModalFooterActions>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {resolvedCancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading ? t("working") : resolvedConfirmLabel}
          </Button>
        </ModalFooterActions>
      }
    >
      {Icon || description || children ? (
        <div className="ds-modal-confirm-body">
          {Icon ? <Icon className={cn("ds-icon-lg ds-modal-confirm-body__icon", iconClassName)} /> : null}
          <div className="ds-modal-confirm-content">
            {description ? <Text variant="muted">{description}</Text> : null}
            {children}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
