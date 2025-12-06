"use client";

import { format } from "date-fns";
import { CalendarIcon, Globe, Lock, Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import { VideoUploadFormValues } from "../schemas";

interface VideoPublishingProps {
  form: UseFormReturn<VideoUploadFormValues>;
}

export function VideoPublishing({ form }: VideoPublishingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing</CardTitle>
        <CardDescription>Configure visibility and schedule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
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
              <FormDescription className="text-xs">
                {field.value === "public" && "Everyone can see this video."}
                {field.value === "private" &&
                  "Only you and invited users can watch."}
                {field.value === "unlisted" &&
                  "Anyone with the link can watch."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-border h-px" />

        <FormField
          control={form.control}
          name="scheduledAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Schedule</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription className="text-xs">
                Schedule when this video becomes public.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
