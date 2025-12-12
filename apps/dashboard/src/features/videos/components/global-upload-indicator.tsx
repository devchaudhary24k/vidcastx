"use client";

import { useEffect } from "react";
import { uploadStore } from "@dashboard/features/videos/stores/upload-store";
import { uppy } from "@dashboard/lib/uppy-client";
import { useStore } from "@tanstack/react-store";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@vidcastx/ui/components/item";
import { Progress } from "@vidcastx/ui/components/progress";
import { Spinner } from "@vidcastx/ui/components/spinner";

export function GlobalUploadIndicator() {
  // 1. Subscribe to the store
  const { uploads } = useStore(uploadStore);
  const uploadList = Object.values(uploads);

  // 2. Hide completely if no uploads exist
  if (uploadList.length === 0) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex w-full max-w-md flex-col gap-4 transition-all duration-300">
      {uploadList.map((upload) => (
        <UploadItem key={upload.id} upload={upload} />
      ))}
    </div>
  );
}

function UploadItem({ upload }: { upload: any }) {
  const isComplete = upload.status === "complete";
  const isError = upload.status === "error";

  useEffect(() => {
    if (upload.status === "complete") {
      const timer = setTimeout(() => {}, 5000);
      return () => clearTimeout(timer);
    }
  }, [upload.status, upload.id]);

  const handleCancel = () => {
    uppy.removeFile(upload.id);
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in flex w-full flex-col gap-4 [--radius:1rem]">
      <Item variant="outline" className="bg-background shadow-lg">
        <ItemMedia variant="icon">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : isError ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Spinner />
          )}
        </ItemMedia>

        <ItemContent>
          <ItemTitle>
            {isComplete
              ? "Upload Complete"
              : isError
                ? "Upload Failed"
                : "Uploading..."}
          </ItemTitle>
          <ItemDescription className="max-w-[200px] truncate">
            {/* Showing filename and percentage */}
            {upload.filename} — {Math.round(upload.progress)}%
          </ItemDescription>
        </ItemContent>

        <ItemActions className="hidden sm:flex">
          {!isComplete && !isError && (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </ItemActions>

        <ItemFooter>
          <Progress
            value={upload.progress}
            className={isError ? "bg-red-100" : ""}
          />
        </ItemFooter>
      </Item>
    </div>
  );
}
