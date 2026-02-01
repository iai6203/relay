import { Image } from "@/components/ai-elements/image";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
]);

const EXTENSION_TO_MEDIA_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

export function isImageFile(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function getMediaType(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return EXTENSION_TO_MEDIA_TYPE[ext] ?? "application/octet-stream";
}

export interface ImageData {
  base64: string;
  mediaType: string;
}
interface ImageViewerProps {
  imageData: ImageData;
  selectedFile: string;
}

export function ImageViewer({ imageData, selectedFile }: ImageViewerProps) {
  return (
    <Image
      base64={imageData.base64}
      mediaType={imageData.mediaType}
      alt={selectedFile}
      className="max-h-full object-contain"
    />
  );
}
