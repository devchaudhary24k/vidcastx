import React from "react";
import { useForm } from "@tanstack/react-form";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { Button } from "@vidcastx/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@vidcastx/ui/components/card";
import { Field, FieldError } from "@vidcastx/ui/components/field";
import { cn } from "@vidcastx/ui/lib/utils";

import { planSelectionSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step3PlanSelection: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: { planId: "pro" },
    validators: { onChange: planSelectionSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 3 Data:", value);
      onComplete();
    },
  });

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$0",
      description: "Perfect for hobbyists",
      features: ["10GB Storage", "Basic Analytics", "Standard Support"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      description: "For growing creators",
      features: [
        "1TB Storage",
        "Advanced Analytics",
        "Priority Support",
        "4k Streaming",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$99",
      description: "For large teams",
      features: [
        "Unlimited Storage",
        "Custom SSO",
        "Dedicated Manager",
        "White-labeling",
      ],
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit().then((r) => {});
      }}
      className="mx-auto max-w-5xl space-y-12"
    >
      <div className="space-y-4 text-center">
        <h2 className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl">
          Choose your plan
        </h2>
        <p className="text-muted-foreground text-xl font-light">
          Select the plan that best fits your needs. You can change this later.
        </p>
      </div>

      <form.Field name="planId">
        {(field) => (
          <Field>
            <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = field.state.value === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => field.handleChange(plan.id)}
                    className="group cursor-pointer outline-none"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    <Card
                      className={cn(
                        "relative h-full overflow-hidden border-2 transition-all duration-300",
                        isSelected
                          ? "border-primary bg-primary/5 scale-[1.03] shadow-xl ring-0"
                          : "bg-muted/40 hover:bg-muted/60 border-transparent hover:scale-[1.01]",
                      )}
                    >
                      {plan.popular && (
                        <div className="bg-primary absolute inset-x-0 top-0 h-1" />
                      )}

                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold">
                              {plan.name}
                            </CardTitle>
                            <CardDescription className="mt-1 text-base">
                              {plan.description}
                            </CardDescription>
                          </div>
                          {plan.popular && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            /mo
                          </span>
                        </div>

                        <ul className="space-y-4">
                          {plan.features.map((feat, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 text-sm"
                            >
                              <div
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted-foreground/20 text-muted-foreground",
                                )}
                              >
                                <Check className="h-3 w-3" />
                              </div>
                              <span
                                className={cn(
                                  isSelected
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground",
                                )}
                              >
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-4">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            className="w-full"
                            tabIndex={-1}
                          >
                            {isSelected ? "Selected" : "Select Plan"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            <FieldError
              errors={field.state.meta.errors}
              className="mt-4 text-center text-lg"
            />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-center pt-8">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="shadow-primary/20 hover:shadow-primary/30 h-14 w-full gap-2 rounded-full px-12 text-lg font-semibold shadow-xl transition-all hover:scale-105 active:scale-95 sm:w-auto"
            >
              Continue to Billing
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
