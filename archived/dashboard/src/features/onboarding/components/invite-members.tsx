import React from "react";
import { inviteMembers } from "@dashboard/features/onboarding/api/invite-members";
import { useForm } from "@tanstack/react-form";
import { Mail, Plus, Shield, Sparkles, Trash2, UserPlus } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vidcastx/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@vidcastx/ui/components/table";

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
      await inviteMembers(value);
      onComplete();
    },
  });

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader className="pb-8 text-center">
        <div className="bg-primary/10 mx-auto mb-4 w-fit rounded-full p-4">
          <UserPlus className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Invite your team</CardTitle>
        <CardDescription className="mx-auto max-w-md text-base">
          Add team members to collaborate on your projects. You can manage permissions at any time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit().then((r) => {});
          }}
          className="space-y-8"
        >
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50%] pl-4">Email Address</TableHead>
                  <TableHead className="w-[35%]">Role</TableHead>
                  <TableHead className="w-[15%] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <form.Field name="invites" mode="array">
                  {(field) => (
                    <>
                      {field.state.value.map((_, index) => (
                        <TableRow key={index} className="group">
                          <TableCell className="py-3 pl-4 align-top">
                            <form.Field name={`invites[${index}].email`}>
                              {(subField) => {
                                const isInvalid =
                                  subField.state.meta.isTouched && subField.state.meta.errors.length > 0;
                                return (
                                  <div className="space-y-1">
                                    <div className="relative">
                                      <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                      <Input
                                        placeholder="colleague@example.com"
                                        className="pl-9"
                                        value={subField.state.value}
                                        onBlur={subField.handleBlur}
                                        onChange={(e) => subField.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                      />
                                    </div>
                                    <FieldError errors={subField.state.meta.errors} />
                                  </div>
                                );
                              }}
                            </form.Field>
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <form.Field name={`invites[${index}].role`}>
                              {(subField) => (
                                <Select
                                  value={subField.state.value}
                                  onValueChange={(val) => subField.handleChange(val as any)}
                                >
                                  <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                      <Shield className="text-muted-foreground h-4 w-4" />
                                      <SelectValue placeholder="Select Role" />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium">Admin</span>
                                        <span className="text-muted-foreground text-xs">Full access to everything</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="editor">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium">Editor</span>
                                        <span className="text-muted-foreground text-xs">Can edit content</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium">Viewer</span>
                                        <span className="text-muted-foreground text-xs">Read-only access</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </form.Field>
                          </TableCell>
                          <TableCell className="py-3 pr-4 text-right align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.removeValue(index)}
                              disabled={field.state.value.length === 1}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow>
                        <TableCell colSpan={3} className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 h-12 w-full border border-dashed"
                            onClick={() => field.pushValue({ email: "", role: "editor" })}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add another member
                          </Button>
                          <FieldError errors={field.state.meta.errors} className="mt-2 text-center" />
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </form.Field>
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-4">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit} size="lg" className="w-full min-w-[200px] sm:w-auto">
                  {isSubmitting ? "Finishing..." : "Complete Setup"}
                  {!isSubmitting && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
