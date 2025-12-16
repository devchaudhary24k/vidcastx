import React from "react";
import { AvatarUploader } from "@dashboard/components/avatar-uploader";
import { useForm } from "@tanstack/react-form";
import { ArrowRight } from "lucide-react";

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
      className="mx-auto max-w-2xl space-y-12"
    >
      <div className="space-y-4 text-center md:text-left">
        <h2 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
          Welcome! <br /> Let's get started.
        </h2>
        <p className="text-muted-foreground max-w-lg text-xl font-light">
          Tell us a bit about yourself so we can personalize your experience.
        </p>
      </div>

      <div className="space-y-10">
        <form.Field name="avatarUrl">
          {(field) => (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="group relative">
                <div className="from-primary to-primary/50 absolute -inset-0.5 rounded-full bg-gradient-to-r opacity-20 blur transition duration-500 group-hover:opacity-50"></div>
                <div className="relative">
                  <AvatarUploader
                    value={field.state.value || ""}
                    onChange={field.handleChange}
                    fallbackInitials="ME"
                  />
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-foreground font-semibold">Profile Photo</p>
                <p className="text-muted-foreground max-w-[200px] text-sm">
                  Click to upload. We support JPG, PNG or GIF.
                </p>
              </div>
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <form.Field
            name="firstName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-base font-medium"
                  >
                    First Name
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="John"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
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
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-base font-medium"
                  >
                    Last Name
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Doe"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
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
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-base font-medium"
                >
                  Recovery Email
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="john.doe@backup.com"
                  aria-invalid={isInvalid}
                  className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                />
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
