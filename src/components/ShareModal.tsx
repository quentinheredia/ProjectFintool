"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { Copy, Download, Link2, Share2, X } from "lucide-react";
import { buildSharePath, type ComparatorInput } from "@/lib/comparator-engine";
import { OG_FORMATS, buildOgImagePath, type OgFormat } from "@/lib/og-card-params";

const FORMAT_LABELS: Record<OgFormat, string> = {
  story: "9:16 Story",
  social: "16:9 Post",
};

const noopSubscribe = () => () => {};

/** Feature checks that must render `false` on the server and resolve in the browser without a hydration mismatch. */
function useBrowserSupport(check: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}

const supportsFileShare = () =>
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([""], "probe.png", { type: "image/png" })] });

const supportsImageCopy = () => typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";

const isUserCancel = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

const ACTION_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]";
const PRIMARY_ACTION_CLASS = `${ACTION_CLASS} bg-brand text-page hover:bg-[#ff4d7a]`;
const SECONDARY_ACTION_CLASS = `${ACTION_CLASS} bg-ink/10 text-ink hover:bg-ink/20`;

interface ShareModalProps {
  input: ComparatorInput;
  cardId: number;
  cardTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ input, cardId, cardTitle, isOpen, onClose }: ShareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pngCache = useRef(new Map<string, Promise<Blob>>());
  const [format, setFormat] = useState<OgFormat>("story");
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const canShareFiles = useBrowserSupport(supportsFileShare);
  const canCopyImage = useBrowserSupport(supportsImageCopy);

  const imagePath = buildOgImagePath(input, { card: cardId, fmt: format });
  const fileName = `parity-card-${cardId}-${format}.png`;
  const { width, height } = OG_FORMATS[format];
  const isLoading = loadedUrl !== imagePath && failedUrl !== imagePath;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function fetchPng(path: string): Promise<Blob> {
    const cached = pngCache.current.get(path);
    if (cached) return cached;
    const request = fetch(path).then((response) => {
      if (!response.ok) throw new Error(`Image request failed with ${response.status}`);
      return response.blob();
    });
    request.catch(() => pngCache.current.delete(path));
    pngCache.current.set(path, request);
    return request;
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action();
      setStatus(successMessage);
    } catch (error) {
      if (!isUserCancel(error)) setStatus("That didn't work. Try Download PNG instead.");
    }
  }

  const shareImage = () =>
    runAction(async () => {
      const file = new File([await fetchPng(imagePath)], fileName, { type: "image/png" });
      await navigator.share({ files: [file], title: `Parity: ${cardTitle}`, url: window.location.origin + buildSharePath(input) });
    }, "Shared");

  const copyImage = () =>
    runAction(
      () => navigator.clipboard.write([new ClipboardItem({ "image/png": fetchPng(imagePath) })]),
      "Image copied to clipboard",
    );

  const copyLink = () =>
    runAction(
      () => navigator.clipboard.writeText(window.location.origin + buildSharePath(input)),
      "Link copied to clipboard",
    );

  function handleClose() {
    setStatus("");
    onClose();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) handleClose();
  }

  function selectFormat(option: OgFormat) {
    setFormat(option);
    setStatus("");
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={closeOnBackdrop}
      aria-labelledby="share-title"
      className="m-auto w-[min(calc(100vw-2rem),30rem)] overscroll-contain rounded-3xl bg-[#121212] p-0 text-ink ring-1 ring-ink-faint backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="share-title" className="text-lg font-semibold tracking-tight">
              Share this card
            </h2>
            <p className="truncate font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">{cardTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close share dialog"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/10 transition hover:bg-ink/20 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div role="group" aria-label="Image size" className="flex gap-1 rounded-full bg-ink/10 p-1">
          {(Object.keys(FORMAT_LABELS) as OgFormat[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={format === option}
              onClick={() => selectFormat(option)}
              className="flex-1 rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand aria-pressed:bg-ink aria-pressed:text-page"
            >
              {FORMAT_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-ink/[0.04]">
          <div
            className="relative w-full"
            style={{ aspectRatio: `${width} / ${height}`, maxHeight: "48dvh", maxWidth: `calc(48dvh * ${width / height})` }}
          >
            {isLoading && <div className="absolute inset-0 animate-pulse rounded-2xl bg-ink/10" aria-hidden />}
            {failedUrl === imagePath ? (
              <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-muted">
                The preview didn&apos;t load. Download PNG may still work, or try again in a moment.
              </p>
            ) : (
              <Image
                key={imagePath}
                src={imagePath}
                alt={`Preview of the ${FORMAT_LABELS[format]} image for ${cardTitle}`}
                width={width}
                height={height}
                unoptimized
                loading="eager"
                onLoad={() => setLoadedUrl(imagePath)}
                onError={() => setFailedUrl(imagePath)}
                className={`h-full w-full rounded-2xl object-contain transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {canShareFiles && (
            <button type="button" onClick={shareImage} className={`${PRIMARY_ACTION_CLASS} col-span-2`}>
              <Share2 className="size-4" strokeWidth={2} aria-hidden />
              Share Image
            </button>
          )}
          {canCopyImage && (
            <button
              type="button"
              onClick={copyImage}
              className={canShareFiles ? SECONDARY_ACTION_CLASS : PRIMARY_ACTION_CLASS}
            >
              <Copy className="size-4" strokeWidth={2} aria-hidden />
              Copy Image
            </button>
          )}
          <a href={imagePath} download={fileName} className={`${SECONDARY_ACTION_CLASS} ${canCopyImage ? "" : "col-span-2"}`}>
            <Download className="size-4" strokeWidth={2} aria-hidden />
            Download PNG
          </a>
          <button type="button" onClick={copyLink} className={`${SECONDARY_ACTION_CLASS} col-span-2`}>
            <Link2 className="size-4" strokeWidth={2} aria-hidden />
            Copy Link
          </button>
        </div>

        <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-ink-muted">
          {status}
        </p>
      </div>
    </dialog>
  );
}
