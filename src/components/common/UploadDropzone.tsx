import * as React from "react";
import { useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  value?: string;
  onChange: (value: string | undefined) => void;

  /**
   * Example:
   *  - "image/*"
   *  - "image/png,image/jpeg,image/webp"
   *  - ".png,.jpg,.jpeg,.webp"
   */
  accept?: string;

  /** Max ORIGINAL file size before processing (bytes) */
  maxSize?: number;

  /** Resize to this max width (keeps aspect ratio). Helps reduce payload. */
  maxWidth?: number;

  /** Output image mime type after processing */
  outputType?: "image/jpeg" | "image/webp" | "image/png";

  /** Start compression quality (only applies to jpeg/webp) */
  quality?: number;

  /** Target processed image size (bytes). Will try to compress down to this. */
  maxOutputSize?: number;

  className?: string;
  placeholder?: string;
}

function bytesToMB(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function parseAccept(accept: string) {
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isFileAccepted(file: File, accept: string) {
  const rules = parseAccept(accept);

  // allow all images
  if (rules.includes("image/*")) return file.type.startsWith("image/");

  const fileName = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith(".")) return fileName.endsWith(rule);
    return mime === rule; // e.g. image/jpeg
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap is fast (most browsers)
  try {
    return await createImageBitmap(file);
  } catch {
    // fallback: HTMLImageElement decode
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0);

      // convert to ImageBitmap
      return await createImageBitmap(canvas);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function renderCompressed(
  file: File,
  maxWidth: number,
  outputType: "image/jpeg" | "image/webp" | "image/png",
  quality: number
): Promise<Blob> {
  const bitmap = await decodeToBitmap(file);

  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to compress image"))),
      outputType,
      outputType === "image/png" ? undefined : quality
    );
  });

  return blob;
}

export function UploadDropzone({
  value,
  onChange,

  // ✅ JPG is image/jpeg, so this ALLOWS .jpg/.jpeg
  accept = "image/png,image/jpeg,image/webp",

  // ✅ allow larger originals
  maxSize = 30 * 1024 * 1024, // 30MB

  // ✅ resize to reduce huge payloads
  maxWidth = 1400,

  // ✅ export to jpeg (good compression)
  outputType = "image/jpeg",

  // ✅ starting quality
  quality = 0.82,

  // ✅ try to keep final upload small (important for JSON + DB)
  maxOutputSize = 1.5 * 1024 * 1024, // ~1.5MB

  className,
  placeholder = "Drop an image here or click to upload",
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!isFileAccepted(file, accept)) {
        alert(
          `Invalid file type.\nAllowed: ${accept}\nSelected: ${file.type || file.name}`
        );
        return;
      }

      if (file.size > maxSize) {
        alert(
          `File is too large.\nMax allowed: ${bytesToMB(maxSize)}MB\nSelected: ${bytesToMB(file.size)}MB`
        );
        return;
      }

      try {
        // We will try multiple passes to hit maxOutputSize
        let currentMaxWidth = maxWidth;
        let currentQuality = quality;

        let blob = await renderCompressed(file, currentMaxWidth, outputType, currentQuality);

        // If still too big, reduce quality and/or width gradually
        // (PNG won't shrink much — jpeg/webp will)
        const minQuality = 0.5;
        const minWidth = 900;

        while (blob.size > maxOutputSize) {
          if (outputType !== "image/png" && currentQuality > minQuality) {
            currentQuality = Math.max(minQuality, currentQuality - 0.08);
          } else if (currentMaxWidth > minWidth) {
            currentMaxWidth = Math.max(minWidth, Math.round(currentMaxWidth * 0.85));
          } else {
            // can't reduce more safely
            break;
          }

          blob = await renderCompressed(file, currentMaxWidth, outputType, currentQuality);
        }

        const dataUrl = await blobToDataUrl(blob);
        onChange(dataUrl);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || "Failed to process image");
      }
    },
    [accept, maxSize, maxWidth, outputType, quality, maxOutputSize, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);

      // allow uploading same file again
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onChange(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-secondary">
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Allowed: {accept}
                <br />
                Max original size: {bytesToMB(maxSize)}MB
                <br />
                Auto resize: max {maxWidth}px
                <br />
                Export: {outputType} (target ≤ {bytesToMB(maxOutputSize)}MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
