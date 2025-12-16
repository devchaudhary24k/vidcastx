import React from "react";
import { useForm } from "@tanstack/react-form";
import { ArrowRight, Lock } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Field, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";

import { billingSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step4Billing: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: {
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    validators: { onChange: billingSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 4 Data:", value);
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
          Billing Information
        </h2>
        <p className="text-muted-foreground max-w-lg text-xl font-light">
          Where should we send your invoices? Securely processed.
        </p>
      </div>

      <div className="space-y-8">
        <form.Field
          name="streetAddress"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field className="space-y-2">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-base font-medium"
                >
                  Street Address
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="1234 Main St"
                  aria-invalid={isInvalid}
                  className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <form.Field
            name="city"
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
                    City
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="New York"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          />

          <form.Field
            name="state"
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
                    State / Province
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="NY"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <form.Field
            name="zipCode"
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
                    Zip Code
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="10001"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          />

          <form.Field
            name="country"
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
                    Country
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="United States"
                    aria-invalid={isInvalid}
                    className="border-input/50 focus:border-primary h-12 bg-transparent px-4 text-lg transition-all focus:ring-0"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          />
        </div>
      </div>

      <div className="text-muted-foreground flex items-center justify-center gap-2 pt-2 text-sm md:justify-start">
        <Lock className="h-4 w-4 text-green-500" />
        <span>Your billing information is encrypted and secure.</span>
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
