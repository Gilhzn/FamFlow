"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ImageUp, RefreshCcw, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n";

interface CaptureZoneProps {
  previewUrl: string | null;
  fileName: string | null;
  busy?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export default function CaptureZone({
  previewUrl,
  fileName,
  busy,
  onSelect,
  onClear,
  onAnalyze,
}: CaptureZoneProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onSelect(file);
  }

  return (
    <div className="animate-fade-up">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label={t("scan.captureAria")}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`group flex min-h-[280px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200 ${
            dragOver
              ? "border-accent bg-accent-soft"
              : "border-line bg-surface-1 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:bg-surface-2"
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform duration-200 group-hover:scale-105">
            <Camera size={28} strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">
              {t("scan.snapTitle")}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-dim">
              {t("scan.snapHint")}
            </p>
          </div>
          <span className="chip bg-surface-2 text-ink-faint">
            <ImageUp size={12} />
            {t("scan.tapCapture")}
          </span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card overflow-hidden"
        >
          <div className="relative bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={t("scan.previewAlt")}
              className="mx-auto max-h-[320px] w-full object-contain"
            />
            <button
              onClick={onClear}
              disabled={busy}
              aria-label={t("scan.removeImage")}
              className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--surface-0)_80%,transparent)] text-ink-dim backdrop-blur transition-colors hover:text-ink disabled:opacity-40"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="min-w-0 flex-1 truncate text-xs text-ink-faint">
              {fileName ?? "photo.jpg"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="btn-ghost !px-3 !py-2 text-xs"
              >
                <RefreshCcw size={13} />
                {t("scan.retake")}
              </button>
              <button onClick={onAnalyze} disabled={busy} className="btn-primary">
                <Sparkles size={15} />
                {t("scan.analyze")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
