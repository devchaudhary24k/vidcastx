"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";

import type { VideoUploadFormValues } from "../schemas";
// Import the hook
import { useVideoUpload } from "../hooks/use-video-upload";
import { videoUploadSchema } from "../schemas";
import { VideoDetails } from "./video-details";
import { VideoDropzone } from "./video-dropzone";
import { VideoPublishing } from "./video-publishing";

export function VideoUploadForm() {
  const router = useRouter();

  // 1. Use the Hook
  const { startUploadProcess, isUploading } = useVideoUpload();

  // 2. Local state to store the actual File object
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<VideoUploadFormValues>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "public",
    },
  });

  // 3. Handle Form Submission
  async function onSubmit(values: VideoUploadFormValues) {
    if (!selectedFile) {
      toast.error("Please select a video file first");
      return;
    }

    try {
      // Pass the file AND the form values to the hook
      const videoId = await startUploadProcess(selectedFile, {
        title: values.title,
        description: values.description,
        visibility: values.visibility,
      });

      if (videoId) {
        // Redirect on success
        router.push("/dashboard/projects");
      }
    } catch (error) {
      // Error is handled in the hook's toast
    }
  }

  // Helper to handle file selection from Dropzone
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-fill title if empty
    if (!form.getValues("title")) {
      form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/projects"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
            <p className="text-muted-foreground mt-1">
              Fill in the details below to publish your new video.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              {/* Pass handleFileSelect to Dropzone */}
              <VideoDropzone
                form={form}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                fileInputRef={fileInputRef}
                onFileSelect={handleFileSelect}
              />
              <VideoDetails form={form} />
            </div>

            <div className="space-y-6 lg:col-span-4">
              <VideoPublishing form={form} />

              <div className="sticky top-6 flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  type="submit"
                  disabled={isUploading || form.formState.isSubmitting}
                >
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
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
