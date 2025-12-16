import React from "react";
import { useForm } from "@tanstack/react-form";

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
      className="space-y-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Billing Information
        </h2>
        <p className="text-muted-foreground">
          Where should we send your invoices?
        </p>
      </div>

      <form.Field
        name="streetAddress"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <Field>
              <FieldLabel htmlFor={field.name}>Street Address</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="1234 Main St"
                aria-invalid={isInvalid}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="city"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>City</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="New York"
                  aria-invalid={isInvalid}
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
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>State / Province</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="NY"
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="zipCode"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>Zip Code</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="10001"
                  aria-invalid={isInvalid}
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
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="United States"
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        />
      </div>

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
