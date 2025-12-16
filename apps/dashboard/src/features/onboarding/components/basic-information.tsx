import React from "react";
import { AvatarUploader } from "@dashboard/components/avatar-uploader";
import { useForm } from "@tanstack/react-form";

import { Button } from "@vidcastx/ui/components/button";
import { Field, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";

import { basicInfoSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step1BasicInfo: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      recoveryEmail: "",
      avatarUrl: "",
    },
    validators: { onSubmit: basicInfoSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 1 Data:", value);
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
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome! Let's get started.
        </h2>
        <p className="text-muted-foreground">Tell us a bit about yourself.</p>
      </div>

      <form.Field name="avatarUrl">
        {(field) => (
          <div className="flex justify-center py-4">
            <AvatarUploader
              value={field.state.value}
              onChange={field.handleChange}
              fallbackInitials="ME"
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="firstName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="John"
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />

        <form.Field
          name="lastName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Doe"
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />
      </div>

      <form.Field
        name="recoveryEmail"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <Field>
              <FieldLabel htmlFor={field.name}>Recovery Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="john.doe@backup.com"
                aria-invalid={isInvalid}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      />

      <div className="flex justify-end pt-4">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Saving..." : "Next Step"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
