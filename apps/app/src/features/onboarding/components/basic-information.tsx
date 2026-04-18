import React, { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { AvatarUploader } from "#app/components/avatar-uploader";
import { updateUser } from "#app/features/onboarding/api/update-user";
import { useUser } from "#app/lib/use-user";
import { ArrowRight } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";

import { basicInfoSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step1BasicInfo: React.FC<StepProps> = ({ onComplete }) => {
  const { data: session } = useUser();

  const form = useForm({
    defaultValues: {
      firstName: session?.user.firstName ?? "",
      lastName: session?.user.lastName ?? "",
      recoveryEmail: "",
      avatarUrl: "",
    },
    validators: { onSubmit: basicInfoSchema },
    onSubmit: async ({ value }) => {
      await updateUser(value);
      onComplete();
    },
  });

  useEffect(() => {
    if (session?.user) {
      if (session.user.firstName) form.setFieldValue("firstName", session.user.firstName);
      if (session.user.lastName) form.setFieldValue("lastName", session.user.lastName);
    }
  }, [session, form]);

  if (!session) return null;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome! Let&apos;s get started.</CardTitle>
        <CardDescription>Tell us a bit about yourself so we can personalize your experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="avatarUrl">
            {(field) => (
              <div className="flex flex-col items-center gap-4">
                <AvatarUploader value={field.state.value || ""} onChange={field.handleChange} fallbackInitials="ME" />
                <div className="text-center">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-muted-foreground text-xs">Click to upload (JPG, PNG, GIF)</p>
                </div>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="firstName">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      placeholder="John"
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="lastName">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      placeholder="Doe"
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <form.Field name="recoveryEmail">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Recovery Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    placeholder="john.doe@backup.com"
                    aria-invalid={isInvalid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? "Saving..." : "Next Step"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
};
