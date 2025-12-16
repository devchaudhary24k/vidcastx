import React from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@dashboard/components/field";
import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Input } from "@vidcastx/ui/components/input";
import { Separator } from "@vidcastx/ui/components/separator";

import { inviteMembersSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step5InviteMembers: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: {
      invites: [{ email: "", role: "editor" }],
    },
    validators: { onChange: inviteMembersSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 5 Data:", value);
      onComplete();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit().then((r) => {});
      }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Invite your team</h2>
        <p className="text-muted-foreground">
          Start collaborating by adding members.
        </p>
      </div>

      <div className="space-y-4">
        <form.Field name="invites" mode="array">
          {(field) => (
            <FieldGroup>
              {field.state.value.map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <form.Field name={`invites[${index}].email`}>
                    {(subField) => {
                      const isInvalid =
                        subField.state.meta.isTouched &&
                        subField.state.meta.errors.length > 0;
                      return (
                        <Field className="flex-1 space-y-1">
                          <Input
                            placeholder="colleague@example.com"
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                            aria-invalid={isInvalid}
                          />
                          <FieldError errors={subField.state.meta.errors} />
                        </Field>
                      );
                    }}
                  </form.Field>

                  <form.Field name={`invites[${index}].role`}>
                    {(subField) => (
                      <Field>
                        <select
                          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-[120px] items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          value={subField.state.value}
                          onChange={(e) =>
                            subField.handleChange(e.target.value as any)
                          }
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </Field>
                    )}
                  </form.Field>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                    className="mt-0"
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => field.pushValue({ email: "", role: "editor" })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add another member
              </Button>
              <FieldError errors={field.state.meta.errors} />
            </FieldGroup>
          )}
        </form.Field>
      </div>

      <Separator />

      <div className="flex justify-end pt-4">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Finishing..." : "Complete Setup"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
