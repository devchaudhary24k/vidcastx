import { FileText, Video } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";
import { Textarea } from "@vidcastx/ui/components/textarea";

import type { VideoUploadForm } from "../hooks/use-video-upload-form";

interface VideoDetailsProps {
  form: VideoUploadForm;
}

export function VideoDetails({ form }: VideoDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Details</CardTitle>
        <CardDescription>Basic information about your video.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Video Title</FieldLabel>
                <div className="relative">
                  <Video className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. My Awesome Project Walkthrough"
                    className="pl-9"
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <div className="relative">
                  <FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Tell viewers what your video is about..."
                    className="min-h-[150px] resize-y pl-9"
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </CardContent>
    </Card>
  );
}
