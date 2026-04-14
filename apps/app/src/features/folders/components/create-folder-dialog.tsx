import type { ReactElement } from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, Loader2 } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@vidcastx/ui/components/radio-group";
import { Switch } from "@vidcastx/ui/components/switch";
import { Textarea } from "@vidcastx/ui/components/textarea";
import { cn } from "@vidcastx/ui/lib/utils";

import type { FolderColor, FolderVisibility } from "../types/folder";
import type { CreateFolderInput } from "../validator/folder-schema";
import { CreateFolderSchema } from "../validator/folder-schema";
import { FolderColorPicker } from "./folder-color-picker";
import { folderVisibilityMeta } from "./folder-visibility-badge";

type CreateFolderDialogProps = {
  children: ReactElement;
  parentFolderName: string;
  onCreate: (input: CreateFolderInput) => void;
};

const VISIBILITY_OPTIONS: FolderVisibility[] = ["private", "unlisted", "public"];

export function CreateFolderDialog({ children, parentFolderName, onCreate }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      visibility: "private" as FolderVisibility,
      color: "slate" as FolderColor,
      coverImageUrl: null as string | null,
      description: null as string | null,
      pinned: false,
      defaultVideoPrivate: true,
      passwordProtected: false,
    },
    validators: { onSubmit: CreateFolderSchema },
    onSubmit: ({ value }) => {
      onCreate(value);
      setOpen(false);
      setAdvancedOpen(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
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
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Launch videos"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="visibility">
              {(field) => (
                <Field>
                  <FieldLabel>Visibility</FieldLabel>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(v) => {
                      const next = v as FolderVisibility;
                      field.handleChange(next);
                      if (next === "private") {
                        form.setFieldValue("defaultVideoPrivate", true);
                      }
                    }}
                    className="gap-2"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => {
                      const meta = folderVisibilityMeta(opt);
                      const selected = field.state.value === opt;
                      return (
                        <label
                          key={opt}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 border p-3 transition-colors",
                            selected ? "border-foreground bg-muted/30" : "border-input hover:bg-muted/20",
                          )}
                        >
                          <RadioGroupItem value={opt} className="mt-0.5" />
                          <div className="flex flex-1 items-start gap-2">
                            <meta.Icon className="text-muted-foreground mt-0.5 size-4" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium">{meta.label}</div>
                              <div className="text-muted-foreground text-[11px]">{meta.description}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </Field>
              )}
            </form.Field>

            <form.Field name="color">
              {(field) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <FolderColorPicker value={field.state.value} onChange={(color) => field.handleChange(color)} />
                </Field>
              )}
            </form.Field>

            <form.Field name="coverImageUrl">
              {(field) => (
                <Field>
                  <FieldLabel>Cover image</FieldLabel>
                  <div className="border-input flex items-center gap-3 border p-3">
                    <div className="bg-muted flex size-12 items-center justify-center overflow-hidden">
                      {field.state.value ? (
                        <img src={field.state.value} alt="Cover preview" className="size-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-[10px] uppercase">None</span>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" disabled>
                      Upload image
                    </Button>
                    <span className="text-muted-foreground text-[10px]">Coming soon</span>
                  </div>
                </Field>
              )}
            </form.Field>

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
                        onChange={(e) => field.handleChange(e.target.value || null)}
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
                      description="Keep this folder pinned above others."
                      checked={field.state.value}
                      onChange={(v) => field.handleChange(v)}
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
                          onChange={(v) => field.handleChange(v)}
                        />
                      )}
                    </form.Field>
                  )}
                </form.Subscribe>

                <form.Field name="passwordProtected">
                  {(field) => (
                    <ToggleRow
                      label="Password protect"
                      description="Require a password to view this folder. (Coming soon — UI preview only.)"
                      checked={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                    />
                  )}
                </form.Field>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

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
