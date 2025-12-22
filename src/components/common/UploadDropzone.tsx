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

  /**
   * Max PROCESSED blob size (bytes) AFTER resize/compress.
   * This is the important one to avoid huge base64 JSON payloads.
   */
  maxProcessedSize?: number;

  /** Resize to this max width (keeps aspect ratio). Helps reduce payload. */
  maxWidth?: number;

  /** Output image mime type after processing */
  outputType?: "image/jpeg" | "image/webp" | "image/png";

  /** Compression quality (only applies to jpeg/webp) */
  quality?: number;

  className?: string;
  placeholder?: string;
}

function bytesToMB(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

function parseAccept(accept: string) {
  // supports "image/png,image/jpeg" OR ".png,.jpg" OR "image/*"
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
    return mime === rule; // mime match, e.g. image/jpeg
  });
}

async function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(fileOrBlob);
  });
}

async function compressAndResizeImage(
  file: File,
  maxWidth: number,
  outputType: "image/jpeg" | "image/webp" | "image/png",
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

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

  // ✅ allow JPG explicitly + common formats
  accept = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",

  // ✅ allow big original file (before processing)
  maxSize = 30 * 1024 * 1024, // 30MB

  // ✅ limit processed blob to keep base64 JSON safe
  // base64 adds ~33% size overhead, so keep processed <= ~12MB typically safe
  maxProcessedSize = 12 * 1024 * 1024, // 12MB

  // ✅ defaults that reduce payload
  maxWidth = 1400,
  outputType = "image/jpeg",
  quality = 0.82,

  className,
  placeholder = "Drop an image here or click to upload",
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // 1) type validation
      if (!isFileAccepted(file, accept)) {
        alert(
          `Invalid file type.\nAllowed: ${accept}\nSelected: ${file.type || file.name}`
        );
        return;
      }

      // 2) original size validation
      if (file.size > maxSize) {
        alert(
          `File is too large.\nMax allowed: ${bytesToMB(
            maxSize
          )}MB\nSelected: ${bytesToMB(file.size)}MB`
        );
        return;
      }

      try {
        // 3) compress + resize
        const processedBlob = await compressAndResizeImage(
          file,
          maxWidth,
          outputType,
          quality
        );

        // 4) processed size validation (important)
        if (processedBlob.size > maxProcessedSize) {
          alert(
            `Image is still too large after processing.\nProcessed: ${bytesToMB(
              processedBlob.size
            )}MB\nMax processed: ${bytesToMB(
              maxProcessedSize
            )}MB\n\nTry:\n- Use smaller image\n- Reduce maxWidth (e.g. 1000)\n- Reduce quality (e.g. 0.7)\n- Use WEBP outputType`
          );
          return;
        }

        // 5) convert to data URL
        const dataUrl = await fileToDataUrl(processedBlob);
        onChange(dataUrl);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || "Failed to process image");
      }
    },
    [
      accept,
      maxSize,
      maxProcessedSize,
      maxWidth,
      outputType,
      quality,
      onChange,
    ]
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

      // allow re-uploading same file again
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
                Max processed size: {bytesToMB(maxProcessedSize)}MB
                <br />
                Auto resize: max {maxWidth}px, export: {outputType}, q={quality}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
