"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/components/kokonutui/file-upload";

interface AudioUploadProps {
  onFileSelect?: (file: File) => void;
  onUploadComplete?: (file: File) => void;
  onError?: (error: { message: string; code: string }) => void;
  accept?: string[];
  maxSize?: number;
  className?: string;
}

// Audio file MIME types
const AUDIO_MIME_TYPES = [
  "audio/mpeg", // mp3
  "audio/wav", // wav
  "audio/m4a", // m4a
  "audio/x-m4a", // m4a (alternative)
  "video/mp4", // mp4 (audio in mp4 container)
  "audio/aac", // aac
  "audio/flac", // flac
  "audio/ogg", // ogg
];

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i] || sizes[sizes.length - 1]}`;
};

const estimateDuration = (fileSize: number): string => {
  // Rough estimation: 1MB ≈ 1 minute for compressed audio
  const minutes = Math.round(fileSize / (1024 * 1024));
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `~${hours}h ${remainingMinutes}m`;
};

export function AudioUpload({
  onFileSelect,
  onUploadComplete,
  onError,
  accept = AUDIO_MIME_TYPES,
  maxSize = 500 * 1024 * 1024, // 500MB default
  className,
}: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    duration: string;
  } | null>(null);

  // Custom validation for audio files
  const validateAudioFile = useCallback(
    (file: File) => {
      const fileType = file.type.toLowerCase();

      // Check if file type is in accepted audio types
      const isValidType = accept.some((type) =>
        fileType.match(type.toLowerCase())
      );

      if (!isValidType) {
        return {
          message: `Invalid audio format. Accepted: ${accept
            .map((t) => t.split("/")[1])
            .join(", ")
            .toUpperCase()}`,
          code: "INVALID_AUDIO_TYPE",
        };
      }

      // Additional validation: check file extension as fallback
      const fileName = file.name.toLowerCase();
      const validExtensions = [
        ".mp3",
        ".wav",
        ".m4a",
        ".mp4",
        ".aac",
        ".flac",
        ".ogg",
      ];
      const hasValidExtension = validExtensions.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!hasValidExtension) {
        return {
          message: `File must have a valid audio extension: ${validExtensions.join(", ")}`,
          code: "INVALID_AUDIO_EXTENSION",
        };
      }

      return null;
    },
    [accept]
  );

  const handleUploadSuccess = useCallback(
    (file: File) => {
      // Store file info
      setSelectedFile(file);
      setFileInfo({
        name: file.name,
        size: formatBytes(file.size),
        duration: estimateDuration(file.size),
      });

      // Notify parent component
      onFileSelect?.(file);
      onUploadComplete?.(file);
    },
    [onFileSelect, onUploadComplete]
  );

  const handleUploadError = useCallback(
    (error: { message: string; code: string }) => {
      onError?.(error);
    },
    [onError]
  );

  return (
    <div className={className}>
      <FileUpload
        acceptedFileTypes={accept}
        maxFileSize={maxSize}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        validateFile={validateAudioFile}
        uploadDelay={0} // Disable simulation for real upload flow
      />

      {/* Display file info after selection */}
      {fileInfo && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
          <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Selected Audio File
          </h3>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span className="font-medium">File:</span>
              <span className="truncate max-w-xs" title={fileInfo.name}>
                {fileInfo.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Size:</span>
              <span>{fileInfo.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Duration:</span>
              <span className="text-gray-500">{fileInfo.duration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
