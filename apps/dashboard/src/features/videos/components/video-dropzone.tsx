"use client";

import * as React from "react";
import { CloudUpload, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import {
  ACCEPTED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  VideoUploadFormValues,
} from "../schemas";

interface VideoDropzoneProps {
  form: UseFormReturn<VideoUploadFormValues>;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function VideoDropzone({
  form,
  previewUrl,
  setPreviewUrl,
  fileInputRef,
}: VideoDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Max size is 5GB.");
      return;
    }
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a video file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    form.setValue("title", file.name.split(".")[0]);

    // Manually set the file in react-hook-form
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    form.setValue("file", dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    form.resetField("file");
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-2 border-dashed transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25",
        previewUrl ? "border-border bg-background p-0" : "",
      )}
      onDragOver={!previewUrl ? onDragOver : undefined}
      onDragLeave={!previewUrl ? onDragLeave : undefined}
      onDrop={!previewUrl ? onDrop : undefined}
    >
      <CardContent className="p-0">
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <div className="w-full">
                  {!previewUrl ? (
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center py-16 text-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div
                        className={cn(
                          "bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-200",
                          isDragging ? "scale-110" : "group-hover:scale-105",
                        )}
                      >
                        <CloudUpload className="text-muted-foreground h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {isDragging
                          ? "Drop file to upload"
                          : "Drag & drop or click to upload"}
                      </h3>
                      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                        Support for MP4, MOV, and WebM files up to 5GB
                      </p>
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-black">
                      <video
                        src={previewUrl}
                        controls
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute top-0 right-0 left-0 bg-gradient-to-b from-black/50 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 gap-2"
                            onClick={clearFile}
                          >
                            <X className="h-4 w-4" />
                            Replace Video
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <Input
                    {...field}
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_VIDEO_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              </FormControl>
              <FormMessage className="px-6 pb-4 text-center" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
