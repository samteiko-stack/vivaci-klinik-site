"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "@/lib/icons";
import { getMediaKind, type MediaKind } from "@/lib/media-kind";
import { Button } from "./Button";
import { Text } from "./Text";

export type MediaPreviewSource = {
  url: string;
  fileName: string;
  mimeType: string;
};

function downloadMedia(source: MediaPreviewSource) {
  const anchor = document.createElement("a");
  anchor.href = source.url;
  anchor.download = source.fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function PreviewContent({ source, kind }: { source: MediaPreviewSource; kind: MediaKind }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    };
  }, [source.url]);

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source.url} alt={source.fileName} className="ds-media-preview__image" />
    );
  }

  if (kind === "video") {
    return (
      <video
        ref={videoRef}
        key={source.url}
        controls
        playsInline
        autoPlay
        className="ds-media-preview__video"
      >
        <source src={source.url} type={source.mimeType || undefined} />
      </video>
    );
  }

  if (kind === "audio") {
    return (
      <div className="ds-media-preview__audio">
        <audio ref={audioRef} key={source.url} src={source.url} controls autoPlay className="ds-media-preview__audio-player" />
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={source.url}
        title={source.fileName}
        className="ds-media-preview__pdf"
      />
    );
  }

  return (
    <div className="ds-media-preview__fallback">
      <FileText className="ds-icon-lg" strokeWidth={1.75} />
      <Text variant="muted">Preview is not available for this file type.</Text>
      <Button type="button" variant="secondary" onClick={() => downloadMedia(source)}>
        Download
      </Button>
    </div>
  );
}

export function MediaPreviewModal({
  source,
  onClose,
}: {
  source: MediaPreviewSource | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!source) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [source, onClose]);

  if (!source || typeof document === "undefined") return null;

  const kind = getMediaKind(source.mimeType);

  return createPortal(
    <div className="ds-media-preview-backdrop" onClick={onClose} role="presentation">
      <div
        className="ds-media-preview"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={source.fileName}
      >
        <div className="ds-media-preview__head">
          <Text variant="body-sm" as="p" className="ds-media-preview__title">
            {source.fileName}
          </Text>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="ds-icon-sm" />
          </Button>
        </div>
        <div className="ds-media-preview__body">
          <PreviewContent source={source} kind={kind} />
        </div>
      </div>
    </div>,
    document.body
  );
}
