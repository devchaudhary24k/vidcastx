import React from "react";
import { useForm } from "@tanstack/react-form";
import { Mail, Plus, Shield, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@vidcastx/ui/components/card";
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Invite your team</CardTitle>
        <CardDescription>
          Start collaborating by adding members to your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit().then((r) => {});
          }}
          className="space-y-6"
        >
          <form.Field name="invites" mode="array">
            {(field) => (
              <FieldGroup className="space-y-3">
                {field.state.value.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <form.Field name={`invites[${index}].email`}>
                      {(subField) => {
                        const isInvalid =
                          subField.state.meta.isTouched &&
                          subField.state.meta.errors.length > 0;
                        return (
                          <div className="flex-1">
                            <div className="relative">
                              <Mail className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                              <Input
                                placeholder="colleague@example.com"
                                className="h-9 pl-9"
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
                        <div className="w-[120px]">
                          <Select
                            value={subField.state.value}
                            onValueChange={(val) =>
                              subField.handleChange(val as any)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <div className="flex items-center gap-2">
                                <Shield className="text-muted-foreground h-3.5 w-3.5" />
                                <SelectValue placeholder="Role" />
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
                      className="text-muted-foreground hover:text-destructive h-9 w-9 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full border-dashed"
                  onClick={() => field.pushValue({ email: "", role: "editor" })}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add another member
                </Button>
                <FieldError errors={field.state.meta.errors} />
              </FieldGroup>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? "Finishing..." : "Complete Setup"}
                {!isSubmitting && <Sparkles className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
};
