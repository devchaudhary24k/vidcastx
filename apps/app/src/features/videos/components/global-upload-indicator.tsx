import { useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";

import { Progress } from "@vidcastx/ui/components/progress";

import type { UploadItem as UploadItemType } from "#app/features/videos/stores/upload-store";
import { uploadStore } from "#app/features/videos/stores/upload-store";
import { uppy } from "#app/lib/uppy-client";

export function GlobalUploadIndicator() {
  const { uploads } = useStore(uploadStore, (state) => state);
  const uploadList = Object.values(uploads);

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
  const toastIdRef = useRef<string | number>(upload.id);

  useEffect(() => {
    const isComplete = upload.status === "complete";
    const isError = upload.status === "error";

    // 1. Success State
    if (isComplete) {
      toast.success("Upload Complete", {
        id: toastIdRef.current,
        description: upload.filename,
        duration: 5000,
        // Optional: Force width override if Sonner configuration allows it
        className: "w-[400px] min-w-[400px]",
      });
      return;
    }

    // 2. Error State
    if (isError) {
      toast.error("Upload Failed", {
        id: toastIdRef.current,
        description: upload.error || upload.filename,
        duration: 5000,
        className: "w-[400px] min-w-[400px]",
      });
      return;
    }

    // 3. Loading State
    toast.loading("Uploading...", {
      id: toastIdRef.current,
      className: "w-[400px] min-w-[400px]", // Increased Width applied directly to the Toast container
      description: (
        <div className="mt-2 flex w-full flex-col gap-2">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="max-w-[250px] truncate">{upload.filename}</span>
            <span>{Math.round(upload.progress)}%</span>
          </div>
          <Progress value={upload.progress} className="h-2" />
        </div>
      ),
      action: {
        label: "Cancel",
        onClick: () => {
          // If Uppy automatically syncs with the store, remove uploadActions here.
          uppy.removeFile(upload.id);
          toast.dismiss(toastIdRef.current);
        },
      },
      duration: Infinity,
    });
  }, [upload.status, upload.progress, upload.id, upload.filename, upload.error]);

  return null;
}
