export type MediaKind = "image" | "video" | "audio" | "pdf" | "other";

export type WhatsAppMediaType = "image" | "document" | "video" | "audio" | "sticker";

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/3gpp": "3gp",
  "video/quicktime": "mov",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const GENERIC_ATTACHMENT_NAME =
  /^(attachment|photo|video|voice-message|document|sticker)-\d+\.[a-z0-9]+$/i;

export function getMediaKind(mimeType: string): MediaKind {
  const type = mimeType.trim().toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  return "other";
}

export function supportsInlinePreview(mimeType: string): boolean {
  const kind = getMediaKind(mimeType);
  return kind === "image" || kind === "video" || kind === "audio" || kind === "pdf";
}

export function mimeToExtension(mimeType: string): string | null {
  const normalized = mimeType.trim().toLowerCase();
  if (MIME_EXTENSION[normalized]) return MIME_EXTENSION[normalized];
  if (normalized.startsWith("image/")) return normalized.split("/")[1]?.split("+")[0] ?? "img";
  if (normalized.startsWith("video/")) return normalized.split("/")[1]?.split("+")[0] ?? "mp4";
  if (normalized.startsWith("audio/")) return normalized.split("/")[1]?.split("+")[0] ?? "audio";
  return null;
}

export function normalizeWhatsAppMime(mimeType: string, whatsappType?: WhatsAppMediaType | string): string {
  const mime = mimeType.trim().toLowerCase();
  if (mime && mime !== "application/octet-stream") return mime;

  switch (whatsappType) {
    case "image":
      return "image/jpeg";
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/ogg";
    case "sticker":
      return "image/webp";
    case "document":
      return "application/pdf";
    default:
      return mime || "application/octet-stream";
  }
}

export function inferWhatsAppFileName(
  item: { contentType: string; fileName?: string; whatsappType?: WhatsAppMediaType | string },
  index: number
): string {
  const existing = item.fileName?.trim();
  if (existing && !/^attachment-\d+\.bin$/i.test(existing)) return existing;

  const mimeType = normalizeWhatsAppMime(item.contentType, item.whatsappType);
  const ext = mimeToExtension(mimeType) ?? "bin";
  const base =
    item.whatsappType === "audio"
      ? "voice-message"
      : item.whatsappType === "video"
        ? "video"
        : item.whatsappType === "image"
          ? "photo"
          : item.whatsappType === "sticker"
            ? "sticker"
            : item.whatsappType === "document"
              ? "document"
              : "attachment";

  return `${base}-${index + 1}.${ext}`;
}

export function formatAttachmentDisplayName(fileName: string, mimeType: string): string {
  const trimmed = fileName.trim();
  if (trimmed && !trimmed.endsWith(".bin") && !GENERIC_ATTACHMENT_NAME.test(trimmed)) {
    return trimmed;
  }

  const kind = getMediaKind(mimeType);
  const mime = mimeType.toLowerCase();

  if (kind === "image") return "Photo";
  if (kind === "video") return "Video";
  if (kind === "audio") return "Voice message";
  if (kind === "pdf") return "PDF document";
  if (mime.includes("word") || mime.includes("document.wordprocessingml")) return "Word document";
  if (mime.includes("sheet") || mime.includes("excel")) return "Spreadsheet";
  if (mime.includes("text/plain")) return "Text file";
  return "File attachment";
}

export function downloadMediaFile(source: { url: string; fileName: string }) {
  const anchor = document.createElement("a");
  anchor.href = source.url;
  anchor.download = source.fileName;
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
