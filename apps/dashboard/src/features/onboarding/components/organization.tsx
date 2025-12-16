import React, { useEffect } from "react";
import { AvatarUploader } from "@dashboard/components/avatar-uploader";
import { useForm, useStore } from "@tanstack/react-form";

import { Button } from "@vidcastx/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";

import { organizationSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step2Organization: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: {
      orgName: "",
      orgSlug: "",
      orgAvatarUrl: "",
    },
    validators: { onChange: organizationSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 2 Data:", value);
      onComplete();
    },
  });

  // Watch orgName to generate slug and avatar initials
  const orgName = useStore(form.store, (state) => state.values.orgName);

  useEffect(() => {
    if (orgName) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setFieldValue("orgSlug", slug);
    }
  }, [orgName, form]);

  const getInitials = (name: string) => {
    if (!name) return "OR";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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
          Create your Organization
        </h2>
        <p className="text-muted-foreground">
          This will be your workspace on our platform.
        </p>
      </div>

      <form.Field name="orgAvatarUrl">
        {(field) => (
          <div className="flex justify-center py-4">
            <AvatarUploader
              value={field.state.value || ""}
              onChange={field.handleChange}
              fallbackInitials={getInitials(orgName)}
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="orgName"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <Field>
              <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Acme Inc."
                aria-invalid={isInvalid}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      />

      <form.Field
        name="orgSlug"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <Field>
              <FieldLabel htmlFor={field.name}>Organization URL</FieldLabel>
              <div className="flex items-center">
                <span className="bg-muted text-muted-foreground flex h-10 items-center rounded-l-md border border-r-0 px-3 py-2 text-sm">
                  app.video.com/
                </span>
                <Input
                  id={field.name}
                  name={field.name}
                  className="rounded-l-none"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="acme-inc"
                  aria-invalid={isInvalid}
                />
              </div>
              <FieldDescription>
                This will be the unique URL for your organization.
              </FieldDescription>
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
