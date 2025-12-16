import React, { useEffect } from "react";
import { AvatarUploader } from "@dashboard/components/avatar-uploader";
import { useForm, useStore } from "@tanstack/react-form";
import { ArrowRight, Globe } from "lucide-react";

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
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? "";
      const second = parts[1]?.[0] ?? "";
      return (first + second).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit().then((r) => {});
      }}
      className="mx-auto max-w-2xl space-y-12"
    >
      <div className="space-y-4 text-center md:text-left">
        <h2 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
          Create your <br /> Organization
        </h2>
        <p className="text-muted-foreground max-w-lg text-xl font-light">
          This will be your shared workspace for collaboration.
        </p>
      </div>

      <div className="space-y-10">
        <form.Field name="orgAvatarUrl">
          {(field) => (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="group relative">
                <div className="from-primary to-primary/50 absolute -inset-0.5 rounded-full bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-50"></div>
                <div className="relative">
                  <AvatarUploader
                    value={field.state.value || ""}
                    onChange={field.handleChange}
                    fallbackInitials={getInitials(orgName)}
                  />
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-foreground font-semibold">
                  Organization Logo
                </p>
                <p className="text-muted-foreground max-w-[200px] text-sm">
                  Upload a logo to make your workspace recognizable.
                </p>
              </div>
            </div>
          )}
        </form.Field>

        <form.Field
          name="orgName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-base font-medium"
                >
                  Organization Name
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Acme Inc."
                  aria-invalid={isInvalid}
                  className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
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
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-base font-medium"
                >
                  Organization URL
                </FieldLabel>
                <div className="group focus-within:ring-primary relative rounded-md transition-all focus-within:ring-2 focus-within:ring-offset-2">
                  <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Globe className="h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground absolute inset-y-0 left-11 flex items-center text-lg font-light tracking-wide">
                    app.video.com/
                  </span>
                  <Input
                    id={field.name}
                    name={field.name}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 pl-[145px] text-lg transition-all focus:ring-0"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="acme-inc"
                    aria-invalid={isInvalid}
                  />
                </div>
                <FieldDescription className="text-sm">
                  This will be the unique URL for your organization.
                </FieldDescription>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />
      </div>

      <div className="pt-8">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="shadow-primary/20 hover:shadow-primary/30 h-12 w-full gap-2 rounded-full px-8 text-base font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Next Step"}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
