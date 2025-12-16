import React from "react";
import { useForm } from "@tanstack/react-form";
import { Check, Mail, Plus, Shield, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Field, FieldError, FieldGroup } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vidcastx/ui/components/select";

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
      className="mx-auto max-w-3xl space-y-12"
    >
      <div className="space-y-4 text-center md:text-left">
        <h2 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
          Invite your team
        </h2>
        <p className="text-muted-foreground max-w-lg text-xl font-light">
          Start collaborating by adding members to your organization.
        </p>
      </div>

      <div className="space-y-6">
        <form.Field name="invites" mode="array">
          {(field) => (
            <FieldGroup className="space-y-4">
              {field.state.value.map((_, index) => (
                <div
                  key={index}
                  className="border-border/50 bg-background/50 hover:border-primary/30 group flex flex-col items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:shadow-md sm:flex-row"
                >
                  <form.Field name={`invites[${index}].email`}>
                    {(subField) => {
                      const isInvalid =
                        subField.state.meta.isTouched &&
                        subField.state.meta.errors.length > 0;
                      return (
                        <div className="w-full flex-1 space-y-1">
                          <div className="relative">
                            <Mail className="text-muted-foreground group-focus-within:text-primary absolute top-3.5 left-4 h-5 w-5 transition-colors" />
                            <Input
                              placeholder="colleague@example.com"
                              className="bg-muted/30 focus:bg-background h-12 border-transparent pl-12 text-base transition-all focus:ring-0"
                              value={subField.state.value}
                              onBlur={subField.handleBlur}
                              onChange={(e) =>
                                subField.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                            />
                          </div>
                          <FieldError errors={subField.state.meta.errors} />
                        </div>
                      );
                    }}
                  </form.Field>

                  <form.Field name={`invites[${index}].role`}>
                    {(subField) => (
                      <div className="w-full sm:w-[160px]">
                        <Select
                          value={subField.state.value}
                          onValueChange={(val) =>
                            subField.handleChange(val as any)
                          }
                        >
                          <SelectTrigger className="bg-muted/30 focus:bg-background h-12 border-transparent transition-all">
                            <div className="flex items-center gap-2">
                              <Shield className="text-muted-foreground h-4 w-4" />
                              <SelectValue placeholder="Select role" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 group w-full border-2 border-dashed py-8 text-base transition-all duration-300"
                onClick={() => field.pushValue({ email: "", role: "editor" })}
              >
                <div className="flex items-center gap-2 transition-transform group-hover:scale-105">
                  <div className="bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground rounded-full p-1 transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Add another member</span>
                </div>
              </Button>
              <FieldError errors={field.state.meta.errors} />
            </FieldGroup>
          )}
        </form.Field>
      </div>

      <div className="flex flex-col items-end gap-4 pt-8">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="shadow-primary/20 hover:shadow-primary/30 h-14 w-full gap-2 rounded-full px-10 text-lg font-semibold shadow-xl transition-all hover:scale-105 active:scale-95 sm:w-auto"
            >
              {isSubmitting ? "Finishing..." : "Complete Setup"}
              {!isSubmitting && <Sparkles className="h-5 w-5" />}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
