"use client";

import { FileText, Video } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@vidcastx/ui/components/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@vidcastx/ui/components/form";
import { Input } from "@vidcastx/ui/components/input";
import { Textarea } from "@vidcastx/ui/components/textarea";

import { VideoUploadFormValues } from "../schemas";

interface VideoDetailsProps {
  form: UseFormReturn<VideoUploadFormValues>;
}

export function VideoDetails({ form }: VideoDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Details</CardTitle>
        <CardDescription>Basic information about your video.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Title</FormLabel>
              <FormControl>
                <div className="relative">
                  <Video className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    placeholder="e.g. My Awesome Project Walkthrough"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Textarea
                    placeholder="Tell viewers what your video is about..."
                    className="min-h-[150px] resize-y pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
