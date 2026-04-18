import type { ReactElement } from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, Image as ImageIcon, Loader2 } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@vidcastx/ui/components/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@vidcastx/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";
import { Switch } from "@vidcastx/ui/components/switch";
import { Textarea } from "@vidcastx/ui/components/textarea";
import { cn } from "@vidcastx/ui/lib/utils";

import type { CreateFolderInput, FolderVisibility } from "../validator/folder-schema";
import { DEFAULT_FOLDER_COLOR } from "../constants/folder-color-presets";
import { CreateFolderSchema } from "../validator/folder-schema";
import { FolderColorPicker } from "./folder-color-picker";
import { folderVisibilityMeta } from "./folder-visibility-badge";

interface CreateFolderDialogProps {
  children: ReactElement;
  parentFolderName: string;
  onCreate: (input: CreateFolderInput) => void | Promise<void>;
  isSubmitting?: boolean;
}

const VISIBILITY_OPTIONS: FolderVisibility[] = ["private", "public"];

export function CreateFolderDialog({ children, parentFolderName, onCreate, isSubmitting }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      visibility: "private" as FolderVisibility,
      color: DEFAULT_FOLDER_COLOR,
      coverImageUrl: null as string | null,
      description: null as string | null,
      pinned: false,
      defaultVideoPrivate: true,
    },
    validators: { onSubmit: CreateFolderSchema },
    onSubmit: async ({ value }) => {
      await onCreate(value);
      setOpen(false);
      setAdvancedOpen(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Create a folder inside <span className="font-medium">{parentFolderName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    autoFocus
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    placeholder="e.g. Launch videos"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="coverImageUrl">
              {(field) => (
                <Field>
                  <FieldLabel>Cover image</FieldLabel>
                  <div className="border-input flex items-center gap-3 border p-3">
                    <div className="bg-muted flex size-16 items-center justify-center overflow-hidden">
                      {field.state.value ? (
                        <img src={field.state.value} alt="Cover preview" className="size-full object-cover" />
                      ) : (
                        <ImageIcon className="text-muted-foreground size-5" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <Button type="button" variant="outline" size="sm" disabled className="self-start">
                        Upload image
                      </Button>
                      <span className="text-muted-foreground text-[11px]">Upload coming soon.</span>
                    </div>
                  </div>
                </Field>
              )}
            </form.Field>

            <div className="grid gap-5 md:grid-cols-2">
              <form.Field name="visibility">
                {(field) => (
                  <Field>
                    <FieldLabel>Visibility</FieldLabel>
                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Visibility">
                      {VISIBILITY_OPTIONS.map((opt) => {
                        const meta = folderVisibilityMeta(opt);
                        const selected = field.state.value === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              field.handleChange(opt);
                              if (opt === "private") {
                                form.setFieldValue("defaultVideoPrivate", true);
                              }
                            }}
                            className={cn(
                              "flex flex-col items-start gap-1 border p-3 text-left transition-colors",
                              selected ? "border-foreground bg-muted/30" : "border-input hover:bg-muted/20",
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <meta.Icon className="size-3.5" />
                              <span className="text-xs font-medium">{meta.label}</span>
                            </div>
                            <span className="text-muted-foreground text-[11px]">{meta.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                )}
              </form.Field>

              <form.Field name="color">
                {(field) => (
                  <Field>
                    <FieldLabel>Color</FieldLabel>
                    <FolderColorPicker
                      value={field.state.value}
                      onChange={(color) => {
                        field.handleChange(color);
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between border-t pt-3 text-xs font-medium"
                  />
                }
              >
                <span>Advanced</span>
                <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <Textarea
                        id={field.name}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value || null);
                        }}
                        placeholder="What's this folder for?"
                        rows={3}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="pinned">
                  {(field) => (
                    <ToggleRow
                      label="Pin to top"
                      description="Show this folder in the pinned row above the main grid."
                      checked={field.state.value}
                      onChange={(v) => {
                        field.handleChange(v);
                      }}
                    />
                  )}
                </form.Field>

                <form.Subscribe selector={(s) => s.values.visibility}>
                  {(visibility) => (
                    <form.Field name="defaultVideoPrivate">
                      {(field) => (
                        <ToggleRow
                          label="New uploads default to private"
                          description={
                            visibility === "private"
                              ? "Locked on — private folders always default to private uploads."
                              : "New videos dropped here will be private until changed."
                          }
                          checked={field.state.value}
                          disabled={visibility === "private"}
                          onChange={(v) => {
                            field.handleChange(v);
                          }}
                        />
                      )}
                    </form.Field>
                  )}
                </form.Subscribe>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, submitting]) => (
                <Button type="submit" disabled={!canSubmit || submitting || isSubmitting}>
                  {(submitting || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create folder
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-muted-foreground text-[11px]">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
