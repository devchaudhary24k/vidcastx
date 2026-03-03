"use client";

import type { UploadItem as UploadItemType } from "@dashboard/features/videos/stores/upload-store";
import { useEffect, useRef } from "react";
import {
  uploadActions,
  uploadStore,
} from "@dashboard/features/videos/stores/upload-store";
import { uppy } from "@dashboard/lib/uppy-client";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";

import { Progress } from "@vidcastx/ui/components/progress";

export function GlobalUploadIndicator() {
  // 1. Subscribe to the store
  const { uploads } = useStore(uploadStore, (state) => state);
  const uploadList = Object.values(uploads);

  // 2. Hide completely if no uploads exist
  if (uploadList.length === 0) return null;

  return (
    <>
      {uploadList.map((upload) => (
        <UploadToast key={upload.id} upload={upload} />
      ))}
    </>
  );
}

function UploadToast({ upload }: { upload: UploadItemType }) {
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const isComplete = upload.status === "complete";
    const isError = upload.status === "error";

    if (isComplete) {
      if (!hasFinishedRef.current) {
        toast.success("Upload Complete", {
          id: upload.id,
          description: upload.filename,
          duration: 5000,
        });
        hasFinishedRef.current = true;
      }
    } else if (isError) {
      if (!hasFinishedRef.current) {
        toast.error("Upload Failed", {
          id: upload.id,
          description: upload.error || upload.filename,
          duration: 5000,
        });
        hasFinishedRef.current = true;
      }
    } else {
      toast.loading("Uploading...", {
        id: upload.id,
        description: (
          <div className="mt-2 flex w-full flex-col gap-2">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span className="max-w-[150px] truncate">{upload.filename}</span>
              <span>{Math.round(upload.progress)}%</span>
            </div>
            <Progress value={upload.progress} className="h-2" />
          </div>
        ),
        action: {
          label: "Cancel",
          onClick: () => {
            uppy.removeFile(upload.id);
            uploadActions.removeUpload(upload.id);
            toast.dismiss(upload.id);
          },
        },
        duration: Infinity,
      });
    }
  }, [
    upload.status,
    upload.progress,
    upload.id,
    upload.filename,
    upload.error,
  ]);

  return null;
}
