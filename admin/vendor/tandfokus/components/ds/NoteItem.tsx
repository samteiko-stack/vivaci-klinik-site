"use client";

import { Trash2 } from "@/lib/icons";
import { useTranslations } from "next-intl";
import { Avatar, AVATAR_SIZE } from "./Avatar";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface NoteItemProps {
  authorName: string;
  time: string;
  content: string;
  className?: string;
  canDelete?: boolean;
  deleting?: boolean;
  confirmDelete?: boolean;
  onRequestDelete?: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}

export function NoteItem({
  authorName,
  time,
  content,
  className,
  canDelete,
  deleting,
  confirmDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: NoteItemProps) {
  const tNotes = useTranslations("leads.notes");
  const tCommon = useTranslations("common");

  return (
    <article className={cn("ds-note-item", className)}>
      <div className="ds-note-item__main">
        <Avatar name={authorName} size={AVATAR_SIZE.inline} className="ds-note-item__avatar" />
        <div className="ds-note-item__body">
          <div className="ds-note-item__meta">
            <span className="ds-note-item__author">{authorName}</span>
            {time && <span className="ds-note-item__time">{time}</span>}
          </div>
          <p className="ds-note-item__text">{content}</p>
        </div>
        {canDelete && !confirmDelete && (
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={deleting}
            title={tCommon("deleteNote")}
            className="ds-note-item__delete"
          >
            <Trash2 className="ds-icon-xs" />
          </button>
        )}
      </div>

      {canDelete && confirmDelete && (
        <div className="ds-note-item__confirm">
          <span>{tNotes("deleteConfirm")}</span>
          <div className="ds-note-item__confirm-actions">
            <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onConfirmDelete}
              disabled={deleting}
            >
              {deleting ? tCommon("deleting") : tCommon("delete")}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
