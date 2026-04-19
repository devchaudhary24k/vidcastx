import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@vidcastx/ui/components/button";

import { useVideoUpload } from "../hooks/use-video-upload";
import { useVideoUploadForm } from "../hooks/use-video-upload-form";
import { VideoDetails } from "./video-details";
import { VideoDropzone } from "./video-dropzone";
import { VideoPublishing } from "./video-publishing";

export function VideoUploadForm() {
  const router = useRouter();
  const { startUploadProcess, isCreatingDraft: isUploading } = useVideoUpload();

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const form = useVideoUploadForm(async (value) => {
    const file = value.file?.[0];
    if (!file) {
      toast.error("Please select a video file first");
      return;
    }

    const videoId = await startUploadProcess(file, {
      title: value.title,
      description: value.description,
      visibility: value.visibility,
    });

    if (videoId) {
      void router.navigate({ to: "/dashboard/projects" });
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/projects"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
            <p className="text-muted-foreground mt-1">Fill in the details below to publish your new video.</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <VideoDropzone
              form={form}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              fileInputRef={fileInputRef}
            />
            <VideoDetails form={form} />
          </div>

          <div className="space-y-6 lg:col-span-4">
            <VideoPublishing form={form} />

            <div className="sticky top-6 flex flex-col gap-3">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button size="lg" className="w-full" type="submit" disabled={isUploading || isSubmitting}>
                    {isUploading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Video
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  router.history.back();
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
