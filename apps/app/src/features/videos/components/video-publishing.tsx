import { format } from "date-fns";
import { CalendarIcon, Globe, Lock, Upload } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Calendar } from "@vidcastx/ui/components/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@vidcastx/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vidcastx/ui/components/select";
import { cn } from "@vidcastx/ui/lib/utils";

import type { VideoUploadForm } from "../hooks/use-video-upload-form";

interface VideoPublishingProps {
  form: VideoUploadForm;
}

export function VideoPublishing({ form }: VideoPublishingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing</CardTitle>
        <CardDescription>Configure visibility and schedule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form.Field name="visibility">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(v) => {
                    if (v) field.handleChange(v);
                  }}
                >
                  <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unlisted">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span>Unlisted</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription className="text-xs">
                  {field.state.value === "public" && "Everyone can see this video."}
                  {field.state.value === "private" && "Only you and invited users can watch."}
                  {field.state.value === "unlisted" && "Anyone with the link can watch."}
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <div className="bg-border h-px" />

        <form.Field name="scheduledAt">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Schedule</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id={field.name}
                        variant="outline"
                        aria-invalid={isInvalid}
                        className={cn("pl-3 text-left font-normal", !field.state.value && "text-muted-foreground")}
                      >
                        {field.state.value ? format(field.state.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.state.value}
                      onSelect={(date) => {
                        field.handleChange(date);
                      }}
                      disabled={(date) => date < new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription className="text-xs">Schedule when this video becomes public.</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </CardContent>
    </Card>
  );
}
