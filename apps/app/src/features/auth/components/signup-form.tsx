import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { emailSignUp } from "#app/utils/provider-signin";
import { z } from "zod";

import { Button } from "@vidcastx/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";
import { cn } from "@vidcastx/ui/lib/utils";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      const { error } = await emailSignUp({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (error) {
        form.setErrorMap({
          onSubmit: { form: error.message ?? "Failed to create account", fields: {} },
        });
        return;
      }

      await router.invalidate();
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="name">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <Input
                      id={field.name}
                      type="text"
                      placeholder="John Doe"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder="m@example.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <Field className="grid grid-cols-2 gap-4">
                <form.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="confirmPassword">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </Field>
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>

              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                  errorMap: state.errorMap,
                })}
              >
                {({ canSubmit, isSubmitting, errorMap }) => {
                  const onSubmitError = errorMap.onSubmit;
                  const submitError =
                    onSubmitError &&
                    typeof onSubmitError === "object" &&
                    "form" in onSubmitError &&
                    typeof onSubmitError.form === "string"
                      ? onSubmitError.form
                      : null;
                  return (
                    <>
                      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- errorMap.onSubmit narrowing above */}
                      {submitError && (
                        <FieldDescription className="text-destructive text-sm font-medium">
                          {submitError}
                        </FieldDescription>
                      )}
                      <Field>
                        <Button type="submit" disabled={!canSubmit || isSubmitting}>
                          {isSubmitting ? "Creating account..." : "Create Account"}
                        </Button>
                        <FieldDescription className="text-center">
                          Already have an account? <a href="/auth/login">Sign in</a>
                        </FieldDescription>
                      </Field>
                    </>
                  );
                }}
              </form.Subscribe>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
